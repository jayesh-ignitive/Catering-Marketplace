import { randomUUID } from 'crypto';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Demo seed: 85 published caterer profiles in Ahmedabad (tenants + caterer_profiles).
 * Uses Unsplash image URLs (no local assets). Idempotent via slug prefix `ahm-demo-`.
 */
export class SeedAhmedabadDemoCaterers1743340000000 implements MigrationInterface {
  name = 'SeedAhmedabadDemoCaterers1743340000000';

  private static readonly SLUG_PREFIX = 'ahm-demo-';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ cnt }] = (await queryRunner.query(
      `SELECT COUNT(*) AS cnt FROM \`tenants\` WHERE \`slug\` LIKE ?`,
      [`${SeedAhmedabadDemoCaterers1743340000000.SLUG_PREFIX}%`],
    )) as { cnt: number | string }[];

    if (Number(cnt) >= 50) {
      return;
    }

    const heroPool = [
      'https://images.unsplash.com/photo-1555244166-011ab2a66252?w=1400&q=80',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400&q=80',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1400&q=80',
      'https://images.unsplash.com/photo-1544148103-07737bf555d2?w=1400&q=80',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1400&q=80',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1400&q=80',
      'https://images.unsplash.com/photo-1563371351-74a4fe251b0d?w=1400&q=80',
      'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=1400&q=80',
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1400&q=80',
      'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1400&q=80',
      'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=1400&q=80',
    ];

    const businessNames = [
      'Agashiye Royal Catering',
      'Manek Chowk Flavors',
      'Sabarmati Feast House',
      'Karnavati Kitchens',
      'Riverfront Banquets & Kitchen',
      'SG Highway Spice Route',
      'Vastrapur Veg Delights',
      'Navrangpura Fine Catering',
      'Prahlad Nagar Party Platters',
      'Bodakdev Elite Catering',
      'Thaltej Wedding Kitchen',
      'Satellite Grand Thali Co.',
      'CG Road Corporate Lunch Box',
      'Ashram Road Traditional Foods',
      'Law Garden Street Catering',
      'Bopal Heritage Kitchens',
      'Gota Celebration Caterers',
      'Nikol Family Feast',
      'Chandkheda Banquet Bites',
      'Naranpura Jain Catering',
      'Shyamal Pure Veg Kitchen',
      'Ambawadi Royal Rasoi',
      'Ellisbridge Premium Catering',
      'Paldi Gujarati Thali House',
      'Isanpur Mega Buffet Co.',
      'Vasna Road Grill & Curry',
      'Jodhpur Cross Road Caterers',
      'Sarkhej Highway Kitchen',
      'South Bopal Fusion Feast',
      'Science City Event Catering',
      'Kankaria Lakeview Catering',
      'Shahibaug Traditional Rasoi',
      'Hatkeshwar Wedding Kitchen',
      'Naroda Industrial Lunch Hub',
      'Odhav Corporate Catering',
      'Vatva Factory Canteen Catering',
      'Ranip Community Kitchen Pro',
      'Kalupur Station Snacks & Meals',
      'Relief Road Old City Thali',
      'Dariapur Heritage Catering',
      'Shahpur Authentic Kathiyawadi',
      'Jamalpur Live Counter Masters',
      'Raipur Darwaza Feast Co.',
      'Khadia Jain Thali Catering',
      'Shastrinagar Birthday Bites',
      'Ghatlodia Premium Platters',
      'Chandlodia Veg Buffet House',
      'Motera Stadium Event Kitchen',
      'Gift City Corporate Catering',
      'Sanand Industrial Catering',
      'Makarba Skyline Catering',
      'Shela Farmhouse Catering',
      'South Ahmedabad BBQ & Grill',
      'Hansol Airport Route Catering',
      'Viratnagar Party Kitchen',
      'Ghuma Devi Circle Caterers',
      'Hebatpur Road Feast Co.',
      'Tragad Ring Road Kitchen',
      'Chharodi Gujarati Rasoi',
      'Khoraj Highway Dhaba Style',
      'Sindhu Bhavan Road Premium',
      'Thaltej Shilp Corporate Lunch',
      'Judges Bungalow Road Catering',
      'Drive-In Road Buffet Masters',
      'Memnagar Pure Veg Kitchen',
      'Gurukul Road Wedding Feast',
      'Stadium Circle Event Catering',
      'Panjrapole Jain Catering Pro',
      'Relief Road Sweets & Savouries',
      'Raikhad Traditional Kitchen',
      'Kalupur Wholesale Lunch Hub',
      'Sarangpur Hanuman Road Thali',
      'Dudheshwar Heritage Feast',
      'Shah Alam Gate Catering',
      'Teen Darwaza Old City Kitchen',
      'Pols of Ahmedabad Mini Catering',
      'Riverfront Walkway Events Food',
      'Kankaria Carnival Catering',
      'Science City Convention Kitchen',
      'Gift City Tower Lunch Club',
      'IIM Road Scholar Catering',
      'CEPT University Area Kitchen',
      'Airport Circle Sky Catering',
      'SP Ring Road Mega Kitchen',
      'Adalaj Stepwell Picnic Catering',
      'Gandhinagar Link Road Catering',
      'Chandkheda GIDC Lunch Wala',
      'Tapovan Circle Spiritual Veg',
      'Sola Overbridge Feast House',
      'Naranpura AMTS Road Catering',
    ];

    const localities = [
      'Satellite',
      'Vastrapur',
      'Navrangpura',
      'Bodakdev',
      'Prahlad Nagar',
      'SG Highway',
      'Maninagar',
      'Bopal',
      'Gota',
      'Chandkheda',
      'Nikol',
      'Odhav',
      'Ashram Road',
      'CG Road',
      'Law Garden',
      'Riverfront',
      'Gift City',
      'Science City',
      'Motera',
      'Hatkeshwar',
    ];

    const categoryIds = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'];
    const categoryLabels: Record<string, string> = {
      c1: 'wedding and large-format receptions',
      c2: 'birthday and family celebrations',
      c3: 'corporate lunches and conferences',
      c4: 'buffet and multi-cuisine spreads',
      c5: 'outdoor and lawn events',
      c6: 'intimate home gatherings',
      c7: 'engagement and ring ceremonies',
      c8: 'live grill and BBQ experiences',
    };

    const priceBands = ['budget', 'mid', 'premium', 'custom'] as const;
    const priceHints = [
      'From ₹320 / plate',
      'From ₹450 / plate',
      'From ₹580 / plate',
      'From ₹720 / plate',
      'Custom quote · min. 80 guests',
      'Corporate boxes from ₹220 / person',
      'Buffet packages from ₹550 / guest',
    ];

    const cuisineSets = [
      ['Gujarati', 'North Indian', 'Jain'],
      ['Gujarati', 'South Indian', 'Chaat'],
      ['Kathiyawadi', 'Punjabi', 'Chinese'],
      ['Continental', 'North Indian', 'Desserts'],
      ['Pure Veg', 'Italian', 'Live counters'],
      ['Rajasthani', 'Gujarati', 'Thali'],
      ['Mughlai', 'North Indian', 'BBQ'],
      ['Street food', 'Indo-Chinese', 'Snacks'],
    ];

    const serviceSets = [
      ['Wedding buffets', 'Live chaat counters', 'Welcome drinks', 'Dessert tables'],
      ['Corporate lunch boxes', 'High-tea spreads', 'Working lunch menus'],
      ['Birthday party packages', 'Kid-friendly menus', 'Cake coordination'],
      ['Outdoor grill stations', 'Chafing dish service', 'Tent coordination'],
      ['Engagement thali', 'Farsan platters', 'Ice gola & live juice'],
      ['Jain satvik menus', 'No onion-garlic options', 'Festival specials'],
      ['Multi-cuisine buffets', 'Silver service', 'Captain-led service'],
      ['Live dosa counter', 'Pav bhaji stall', 'Ice cream cart'],
    ];

    const TARGET = 85;

    for (let i = 0; i < TARGET; i++) {
      const tenantId = randomUUID();
      const profileId = randomUUID();

      await queryRunner.query(
        `UPDATE \`platform_sequences\` SET \`next_value\` = LAST_INSERT_ID(\`next_value\` + 1) WHERE \`name\` = 'tenant_listing'`,
      );
      const [lidRow] = (await queryRunner.query(`SELECT LAST_INSERT_ID() AS lid`)) as { lid: number }[];
      const listingId = Number(lidRow.lid);

      const slug = `${SeedAhmedabadDemoCaterers1743340000000.SLUG_PREFIX}${listingId}`;
      const subdomain = `ahm${listingId}`;
      const baseName = businessNames[i % businessNames.length]!;
      const suffix = Math.floor(i / businessNames.length);
      const displayName = suffix > 0 ? `${baseName} (${suffix + 1})` : baseName;

      const cat = categoryIds[i % categoryIds.length]!;
      const years = 3 + (i % 18);
      const capacity = ['30–150 guests', '50–300 guests', '100–500 guests', '150–800 guests'][i % 4];
      const loc = localities[i % localities.length]!;
      const loc2 = localities[(i + 3) % localities.length]!;
      const loc3 = localities[(i + 7) % localities.length]!;
      const pb = priceBands[i % priceBands.length];
      const rating = Math.min(5, 3.9 + (i % 12) / 10);
      const reviews = 15 + (i * 17) % 420;
      const hero = heroPool[i % heroPool.length]!;
      const g1 = heroPool[(i + 2) % heroPool.length]!;
      const g2 = heroPool[(i + 5) % heroPool.length]!;
      const g3 = heroPool[(i + 8) % heroPool.length]!;

      const tagline = [
        `Ahmedabad’s trusted kitchen for ${categoryLabels[cat]}.`,
        `Premium veg & Jain-friendly menus · ${loc}.`,
        `Corporate & wedding specialists · serving ${loc2} & ${loc3}.`,
        `Live counters, hygienic prep, on-time service in ${loc}.`,
      ][i % 4]!;

      const about =
        `${displayName} operates from ${loc}, Ahmedabad, with ${years}+ years of experience in ${categoryLabels[cat]}. ` +
        `We plan menus, staffing, and logistics for events across ${loc2}, ${loc3}, and surrounding areas. ` +
        `Kitchens follow hygienic prep standards; popular for receptions, corporate lunches, and family functions. ` +
        `Typical events: ${capacity}.`;

      await queryRunner.query(
        `INSERT INTO \`tenants\` (
          \`id\`, \`name\`, \`slug\`, \`subdomain\`, \`db_name\`, \`listing_id\`,
          \`provision_status\`, \`profile_published\`, \`profile_options\`, \`created_at\`, \`updated_at\`
        ) VALUES (?, ?, ?, ?, NULL, ?, 'pending', 0, NULL, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6))`,
        [tenantId, displayName.slice(0, 120), slug.slice(0, 80), subdomain.slice(0, 63), listingId],
      );

      await queryRunner.query(
        `INSERT INTO \`caterer_profiles\` (
          \`id\`, \`tenant_id\`, \`city\`, \`state\`, \`country\`, \`primary_category_id\`,
          \`cuisines\`, \`price_band\`, \`tagline\`, \`about\`, \`hero_image_url\`, \`gallery_images\`,
          \`services_offered\`, \`years_in_business\`, \`capacity_hint\`,
          \`avg_rating\`, \`review_count\`, \`price_hint\`, \`published\`, \`created_at\`, \`updated_at\`
        ) VALUES (
          ?, ?, 'Ahmedabad', 'Gujarat', 'India', ?,
          CAST(? AS JSON), ?, ?, ?, ?, CAST(? AS JSON),
          CAST(? AS JSON), ?, ?,
          ?, ?, ?, 1, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
        )`,
        [
          profileId,
          tenantId,
          cat,
          JSON.stringify(cuisineSets[i % cuisineSets.length]),
          pb,
          tagline.slice(0, 220),
          about,
          hero,
          JSON.stringify([g1, g2, g3]),
          JSON.stringify(serviceSets[i % serviceSets.length]),
          years,
          capacity,
          rating.toFixed(1),
          reviews,
          priceHints[i % priceHints.length],
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const p = `${SeedAhmedabadDemoCaterers1743340000000.SLUG_PREFIX}%`;
    await queryRunner.query(
      `DELETE cp FROM \`caterer_profiles\` cp
       INNER JOIN \`tenants\` t ON t.\`id\` = cp.\`tenant_id\`
       WHERE t.\`slug\` LIKE ?`,
      [p],
    );
    await queryRunner.query(`DELETE FROM \`tenants\` WHERE \`slug\` LIKE ?`, [p]);
  }
}
