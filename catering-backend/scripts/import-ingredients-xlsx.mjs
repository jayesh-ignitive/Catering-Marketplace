/**
 * Import ingredients from Excel into `ingredients` + `ingredient_translations`.
 *
 * Expected sheet "Ingredients" columns (header row):
 *   ID, Ingredient Code, Category, Name EN, Name HI, Name GU,
 *   Purchase Unit, Consumption Unit, Default Purchase Price, Wastage %,
 *   Is Perishable, Slug
 *
 * Columns not stored in DB (price, wastage, perishable) are ignored.
 *
 * Usage:
 *   node scripts/import-ingredients-xlsx.mjs [path/to/file.xlsx]
 *
 * Requires: npm install (xlsx in devDependencies), .env with DB_* vars.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const ALLOWED_UNITS = new Set([
  'KG',
  'GM',
  'LTR',
  'ML',
  'PCS',
  'BOX',
  'PACKET',
  'BOTTLE',
  'TRAY',
]);

function slugifyCategoryLabel(label) {
  return String(label || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeCode(code) {
  return String(code || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '');
}

function normalizeSlug(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 255);
}

async function allocateSlug(conn, base, excludeIngredientId = null) {
  let candidate = base.slice(0, 255) || 'ingredient';
  let n = 0;
  for (;;) {
    const [rows] = await conn.execute(
      excludeIngredientId
        ? 'SELECT id FROM ingredients WHERE slug = ? AND id != ? LIMIT 1'
        : 'SELECT id FROM ingredients WHERE slug = ? LIMIT 1',
      excludeIngredientId
        ? [candidate, excludeIngredientId]
        : [candidate],
    );
    if (!rows.length) return candidate;
    n += 1;
    const suffix = `-${n}`;
    candidate = `${base.slice(0, Math.max(1, 255 - suffix.length))}${suffix}`;
  }
}

async function main() {
  const defaultPath = path.join(
    process.env.USERPROFILE || process.env.HOME || '',
    'Downloads',
    'catering_ingredients_500_records.xlsx',
  );
  const xlsxPath = process.argv[2] || defaultPath;

  if (!fs.existsSync(xlsxPath)) {
    console.error('File not found:', xlsxPath);
    process.exit(1);
  }

  const wb = XLSX.readFile(xlsxPath);
  const sheetName = wb.SheetNames.includes('Ingredients')
    ? 'Ingredients'
    : wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  console.log('Sheet:', sheetName, 'data rows:', rows.length);

  const host = process.env.DB_HOST ?? '127.0.0.1';
  const port = Number(process.env.DB_PORT ?? 3306);
  const user = process.env.DB_USER ?? 'root';
  const password = process.env.DB_PASSWORD ?? '';
  const database = process.env.DB_NAME ?? 'catering';

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    multipleStatements: false,
  });

  const [langRows] = await conn.execute(
    `SELECT id, code FROM languages WHERE deleted_at IS NULL AND code IN ('en','hi','gu')`,
  );
  const langByCode = {};
  for (const r of langRows) {
    langByCode[r.code] = String(r.id);
  }
  if (!langByCode.en) {
    console.error('English language (en) not found in DB.');
    await conn.end();
    process.exit(1);
  }

  const [catRows] = await conn.execute(
    `SELECT id, slug FROM ingredient_categories`,
  );
  const categoryIdBySlug = {};
  for (const r of catRows) {
    categoryIdBySlug[r.slug] = String(r.id);
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const warnings = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const code = normalizeCode(r['Ingredient Code']);
    if (!code) {
      skipped += 1;
      warnings.push(`Row ${i + 2}: missing Ingredient Code`);
      continue;
    }

    const nameEn = String(r['Name EN'] ?? '').trim();
    if (!nameEn) {
      skipped += 1;
      warnings.push(`Row ${i + 2} (${code}): missing Name EN`);
      continue;
    }

    let pu = String(r['Purchase Unit'] ?? '').trim().toUpperCase();
    let cu = String(r['Consumption Unit'] ?? '').trim().toUpperCase();
    if (!ALLOWED_UNITS.has(pu)) {
      warnings.push(`Row ${i + 2} (${code}): invalid Purchase Unit "${pu}", using KG`);
      pu = 'KG';
    }
    if (!ALLOWED_UNITS.has(cu)) {
      warnings.push(`Row ${i + 2} (${code}): invalid Consumption Unit "${cu}", using GM`);
      cu = 'GM';
    }

    const catLabel = String(r.Category ?? '').trim();
    const catSlug = slugifyCategoryLabel(catLabel);
    let categoryId = categoryIdBySlug[catSlug] ?? null;
    if (catLabel && !categoryId) {
      warnings.push(
        `Row ${i + 2} (${code}): category "${catLabel}" → slug "${catSlug}" not found; using NULL`,
      );
    }

    let slug = normalizeSlug(r.Slug);
    if (!slug) slug = normalizeSlug(nameEn);
    if (!slug) slug = `item-${code.toLowerCase()}`;

    const nameHi = String(r['Name HI'] ?? '').trim() || nameEn;
    const nameGu = String(r['Name GU'] ?? '').trim() || nameEn;

    const [existingRows] = await conn.execute(
      `SELECT id, deleted_at FROM ingredients WHERE ingredient_code = ? LIMIT 1`,
      [code],
    );
    const existing = existingRows[0];

    let ingredientId;

    if (existing) {
      ingredientId = String(existing.id);
      if (existing.deleted_at) {
        await conn.execute(
          `UPDATE ingredients SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP(6) WHERE id = ?`,
          [ingredientId],
        );
      }

      slug = await allocateSlug(conn, slug, ingredientId);

      await conn.execute(
        `UPDATE ingredients SET
          ingredient_category_id = ?,
          slug = ?,
          sku = NULL,
          image = NULL,
          purchase_unit = ?,
          consumption_unit = ?,
          conversion_factor = 1,
          shelf_life_days = NULL,
          is_active = 1,
          updated_at = CURRENT_TIMESTAMP(6)
        WHERE id = ?`,
        [categoryId, slug, pu, cu, ingredientId],
      );
      updated += 1;
    } else {
      slug = await allocateSlug(conn, slug, null);
      const [ins] = await conn.execute(
        `INSERT INTO ingredients (
          ingredient_category_id, ingredient_code, sku, slug, image,
          purchase_unit, consumption_unit, conversion_factor,
          shelf_life_days, is_active, created_at, updated_at, deleted_at
        ) VALUES (?, ?, NULL, ?, NULL, ?, ?, 1, NULL, 1, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6), NULL)`,
        [categoryId, code, slug, pu, cu],
      );
      ingredientId = String(ins.insertId);
      inserted += 1;
    }

    const upsertTranslation = async (languageCode, name) => {
      const languageId = langByCode[languageCode];
      if (!languageId || !name.trim()) return;
      await conn.execute(
        `INSERT INTO ingredient_translations (
          ingredient_id, language_id, name, short_name, description,
          created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, NULL, NULL, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6), NULL)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          short_name = NULL,
          description = NULL,
          deleted_at = NULL,
          updated_at = CURRENT_TIMESTAMP(6)`,
        [ingredientId, languageId, name.trim()],
      );
    };

    await upsertTranslation('en', nameEn);
    await upsertTranslation('hi', nameHi);
    await upsertTranslation('gu', nameGu);
  }

  await conn.end();

  console.log('Done. inserted:', inserted, 'updated:', updated, 'skipped:', skipped);
  if (warnings.length) {
    console.log('\nWarnings (first 30):');
    for (const w of warnings.slice(0, 30)) console.log(' ', w);
    if (warnings.length > 30) console.log(`  ... and ${warnings.length - 30} more`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
