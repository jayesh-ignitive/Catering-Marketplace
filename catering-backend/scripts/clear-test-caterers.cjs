/**
 * Delete ALL caterer workspaces and their related data (test-data cleanup).
 *
 * Removes, in the main `catering` DB:
 *   - caterer_profile_categories / _cuisines / _keywords / _gallery_images / _service_offerings
 *   - caterer_profiles           (marketplace listings)
 *   - caterer_reviews
 *   - users WHERE role = 'caterer' (owners + staff)
 *   - tenants                    (contact_submissions.tenant_id is auto SET NULL)
 * ...then DROPs each tenant's dedicated database (`ct_<slug>`).
 *
 * Preserved: admin users, and shared reference data
 *   (cities, states, countries, categories, cuisines, keywords, service_offerings, etc.).
 *
 * Usage (npm — flags baked in, since PowerShell npm does not forward `-- --flag`):
 *   npm run db:clear-caterers          # DRY RUN: preview what would be deleted, change nothing
 *   npm run db:clear-caterers:apply    # actually delete (owners/staff + tenants + DROP per-tenant DBs)
 *
 * Usage (node directly — full flag control):
 *   node scripts/clear-test-caterers.cjs --dry-run                # preview only
 *   node scripts/clear-test-caterers.cjs --yes                    # delete + drop per-tenant DBs
 *   node scripts/clear-test-caterers.cjs --yes --keep-databases   # delete rows, keep the ct_* DBs
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const CONFIRMED = args.includes('--yes');
const KEEP_DATABASES = args.includes('--keep-databases');

const MAIN_DB = process.env.DB_NAME || 'catering';

/** Child/leaf tables scoped entirely to caterers, deleted before their parents. */
const PROFILE_CHILD_TABLES = [
  'caterer_profile_categories',
  'caterer_profile_cuisines',
  'caterer_profile_keywords',
  'caterer_profile_gallery_images',
  'caterer_profile_service_offerings',
];

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.tables
     WHERE table_schema = ? AND table_name = ?`,
    [MAIN_DB, table],
  );
  return Number(rows[0].c) > 0;
}

async function countRows(conn, table) {
  if (!(await tableExists(conn, table))) return null;
  const [rows] = await conn.query(`SELECT COUNT(*) AS c FROM \`${table}\``);
  return Number(rows[0].c);
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ?? 'root',
    database: MAIN_DB,
    multipleStatements: false,
  });

  // --- Gather what will be removed ---------------------------------------
  const [tenants] = await conn.query(
    'SELECT id, name, slug, db_name AS dbName, provision_status AS provisionStatus FROM `tenants`',
  );
  const [caterUserRows] = await conn.query(
    "SELECT COUNT(*) AS c FROM `users` WHERE role = 'caterer'",
  );
  const catererUserCount = Number(caterUserRows[0].c);

  const childCounts = {};
  for (const t of PROFILE_CHILD_TABLES) {
    childCounts[t] = await countRows(conn, t);
  }
  const profileCount = await countRows(conn, 'caterer_profiles');
  const reviewCount = await countRows(conn, 'caterer_reviews');

  const tenantDbNames = tenants
    .map((t) => t.dbName)
    .filter(
      (name) =>
        typeof name === 'string' &&
        name.length > 0 &&
        name !== MAIN_DB &&
        /^ct_[a-z0-9_]+$/i.test(name),
    );

  // --- Report ------------------------------------------------------------
  console.log('==============================================================');
  console.log(` Caterer cleanup target (DB: ${MAIN_DB})`);
  console.log('==============================================================');
  console.log(`  tenants (workspaces) ............. ${tenants.length}`);
  console.log(`  caterer users (role=caterer) ..... ${catererUserCount}`);
  console.log(`  caterer_profiles ................. ${profileCount ?? 'n/a'}`);
  console.log(`  caterer_reviews .................. ${reviewCount ?? 'n/a'}`);
  for (const t of PROFILE_CHILD_TABLES) {
    console.log(`  ${t.padEnd(33, '.')} ${childCounts[t] ?? 'n/a'}`);
  }
  console.log(
    `  per-tenant databases to DROP ..... ${
      KEEP_DATABASES ? '(skipped: --keep-databases)' : tenantDbNames.length
    }`,
  );
  if (tenants.length > 0) {
    console.log('--------------------------------------------------------------');
    for (const t of tenants) {
      console.log(
        `   • ${t.name} [slug=${t.slug}] db=${t.dbName ?? '-'} (${t.provisionStatus})`,
      );
    }
  }
  console.log('==============================================================');

  if (tenants.length === 0 && catererUserCount === 0) {
    console.log('Nothing to delete. Done.');
    await conn.end();
    return;
  }

  if (DRY_RUN) {
    console.log('\nDRY RUN — no changes made. Re-run with --yes to delete.');
    await conn.end();
    return;
  }

  if (!CONFIRMED) {
    console.error(
      '\nRefusing to delete without confirmation. Re-run with --yes (or --dry-run to preview).',
    );
    await conn.end();
    process.exitCode = 1;
    return;
  }

  // --- Delete main-DB rows (child -> parent, FK checks left ON) -----------
  await conn.beginTransaction();
  try {
    for (const table of PROFILE_CHILD_TABLES) {
      if (await tableExists(conn, table)) {
        await conn.query(`DELETE FROM \`${table}\``);
      }
    }
    if (await tableExists(conn, 'caterer_profiles')) {
      await conn.query('DELETE FROM `caterer_profiles`');
    }
    if (await tableExists(conn, 'caterer_reviews')) {
      await conn.query('DELETE FROM `caterer_reviews`');
    }
    // Owners + staff. tenants.user_id FK is ON DELETE SET NULL, so this is safe.
    await conn.query("DELETE FROM `users` WHERE role = 'caterer'");
    // contact_submissions.tenant_id FK is ON DELETE SET NULL (auto-unlinked).
    await conn.query('DELETE FROM `tenants`');
    await conn.commit();
    console.log('\nMain DB rows deleted.');
  } catch (err) {
    await conn.rollback();
    console.error('\nDelete failed, rolled back. No changes made.');
    throw err;
  }

  // --- Drop per-tenant databases (outside the transaction) ---------------
  if (!KEEP_DATABASES && tenantDbNames.length > 0) {
    let dropped = 0;
    for (const dbName of tenantDbNames) {
      try {
        await conn.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
        dropped += 1;
        console.log(`  dropped database: ${dbName}`);
      } catch (err) {
        console.error(`  FAILED to drop database ${dbName}: ${err.message}`);
      }
    }
    console.log(`\nDropped ${dropped}/${tenantDbNames.length} per-tenant databases.`);
  } else if (KEEP_DATABASES) {
    console.log('\nSkipped dropping per-tenant databases (--keep-databases).');
  }

  await conn.end();
  console.log('\nCaterer test-data cleanup complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
