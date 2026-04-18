import { MigrationInterface, QueryRunner } from 'typeorm';

function parseCapacityHint(raw: string | null): { min: number | null; max: number | null } {
  if (raw == null || typeof raw !== 'string') {
    return { min: null, max: null };
  }
  const s = raw.trim();
  if (!s) {
    return { min: null, max: null };
  }
  const range = s.match(/(\d+)\s*[–\-]\s*(\d+)/);
  if (range) {
    const a = Number(range[1]);
    const b = Number(range[2]);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      return { min: Math.min(a, b), max: Math.max(a, b) };
    }
  }
  const minOnly = s.match(/min\.?\s*(\d+)/i);
  if (minOnly) {
    const n = Number(minOnly[1]);
    return Number.isFinite(n) ? { min: n, max: null } : { min: null, max: null };
  }
  const single = s.match(/(\d+)\s*\+?\s*guests?/i);
  if (single) {
    const n = Number(single[1]);
    return Number.isFinite(n) ? { min: n, max: null } : { min: null, max: null };
  }
  return { min: null, max: null };
}

/** First plausible per-guest rupee amount from marketing copy (INR). */
function parsePriceHintToDecimal(raw: string | null): string | null {
  if (raw == null || typeof raw !== 'string') {
    return null;
  }
  const s = raw.trim();
  if (!s || /custom\s*quote/i.test(s)) {
    return null;
  }
  const afterRupee = s.match(/₹\s*([\d,]+(?:\.\d{1,2})?)/);
  if (afterRupee) {
    const n = Number(afterRupee[1]!.replace(/,/g, ''));
    if (Number.isFinite(n) && n > 0 && n < 1_000_000) {
      return n.toFixed(2);
    }
  }
  const fromDigits = s.match(/\b([\d]{2,5})\b/);
  if (fromDigits) {
    const n = Number(fromDigits[1]);
    if (Number.isFinite(n) && n >= 50 && n < 500_000) {
      return n.toFixed(2);
    }
  }
  return null;
}

export class CapacityMinMaxAndPriceFrom1743430000000 implements MigrationInterface {
  name = 'CapacityMinMaxAndPriceFrom1743430000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('caterer_profiles', 'capacity_guest_min')) {
      return;
    }

    await queryRunner.query(
      `ALTER TABLE \`caterer_profiles\` ADD \`capacity_guest_min\` int UNSIGNED NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`caterer_profiles\` ADD \`capacity_guest_max\` int UNSIGNED NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`caterer_profiles\` ADD \`price_from\` decimal(12,2) NULL`,
    );

    const hasCapHint = await queryRunner.hasColumn('caterer_profiles', 'capacity_hint');
    const hasPriceHint = await queryRunner.hasColumn('caterer_profiles', 'price_hint');

    if (hasCapHint || hasPriceHint) {
      const capSel = hasCapHint ? '`capacity_hint`' : 'NULL AS `capacity_hint`';
      const priceSel = hasPriceHint ? '`price_hint`' : 'NULL AS `price_hint`';
      const rows = (await queryRunner.query(
        `SELECT \`id\`, ${capSel}, ${priceSel} FROM \`caterer_profiles\``,
      )) as { id: string; capacity_hint: string | null; price_hint: string | null }[];

      for (const r of rows) {
        const caps = parseCapacityHint(r.capacity_hint);
        const priceFrom = parsePriceHintToDecimal(r.price_hint);
        await queryRunner.query(
          `UPDATE \`caterer_profiles\` SET \`capacity_guest_min\` = ?, \`capacity_guest_max\` = ?, \`price_from\` = ? WHERE \`id\` = ?`,
          [caps.min, caps.max, priceFrom, r.id],
        );
      }
    }

    if (hasCapHint) {
      await queryRunner.query(`ALTER TABLE \`caterer_profiles\` DROP COLUMN \`capacity_hint\``);
    }
    if (hasPriceHint) {
      await queryRunner.query(`ALTER TABLE \`caterer_profiles\` DROP COLUMN \`price_hint\``);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('caterer_profiles', 'capacity_guest_min'))) {
      return;
    }

    await queryRunner.query(
      `ALTER TABLE \`caterer_profiles\` ADD \`capacity_hint\` varchar(80) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`caterer_profiles\` ADD \`price_hint\` varchar(120) NULL`,
    );

    const rows = (await queryRunner.query(
      `SELECT \`id\`, \`capacity_guest_min\`, \`capacity_guest_max\`, \`price_from\` FROM \`caterer_profiles\``,
    )) as {
      id: string;
      capacity_guest_min: number | null;
      capacity_guest_max: number | null;
      price_from: string | null;
    }[];

    for (const r of rows) {
      let capHint: string | null = null;
      if (r.capacity_guest_min != null && r.capacity_guest_max != null) {
        capHint = `${r.capacity_guest_min}–${r.capacity_guest_max} guests`;
      } else if (r.capacity_guest_min != null) {
        capHint = `${r.capacity_guest_min}+ guests`;
      }
      let priceHint: string | null = null;
      if (r.price_from != null && r.price_from !== '') {
        const n = Number(r.price_from);
        if (Number.isFinite(n)) {
          priceHint = `From ₹${Math.round(n)} / plate`;
        }
      }
      await queryRunner.query(
        `UPDATE \`caterer_profiles\` SET \`capacity_hint\` = ?, \`price_hint\` = ? WHERE \`id\` = ?`,
        [capHint, priceHint, r.id],
      );
    }

    await queryRunner.query(`ALTER TABLE \`caterer_profiles\` DROP COLUMN \`capacity_guest_min\``);
    await queryRunner.query(`ALTER TABLE \`caterer_profiles\` DROP COLUMN \`capacity_guest_max\``);
    await queryRunner.query(`ALTER TABLE \`caterer_profiles\` DROP COLUMN \`price_from\``);
  }
}
