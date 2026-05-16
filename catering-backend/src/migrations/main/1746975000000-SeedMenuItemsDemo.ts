import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Demo catalog menu items (80 rows) + English translations.
 * Item codes `SEED_MI_*` are stable so re-run is safe (`INSERT IGNORE`).
 */
export class SeedMenuItemsDemo1746975000000 implements MigrationInterface {
  name = 'SeedMenuItemsDemo1746975000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const rows = buildSeedRows();
    let n = 0;
    for (const r of rows) {
      n += 1;
      const code = `SEED_MI_${String(n).padStart(3, '0')}`;
      const slug = `seed-mi-${String(n).padStart(3, '0')}-${slugify(r.name)}`;
      const name = sqlEsc(r.name);
      const desc = sqlEsc(r.description);
      const prep = r.preparationTime;
      const cook = r.cookingTime;
      const shelf = r.shelfLifeHours === null ? 'NULL' : String(r.shelfLifeHours);
      const cost = r.baseCost.toFixed(2);

      if (r.subcategorySlug) {
        await queryRunner.query(`
          INSERT IGNORE INTO \`menu_items\` (
            \`category_id\`,
            \`subcategory_id\`,
            \`item_code\`,
            \`slug\`,
            \`image\`,
            \`gallery\`,
            \`video_url\`,
            \`preparation_time\`,
            \`cooking_time\`,
            \`shelf_life_hours\`,
            \`base_cost\`,
            \`is_active\`,
            \`created_by\`,
            \`updated_by\`
          )
          SELECT
            pc.\`id\`,
            sc.\`id\`,
            '${code}',
            '${slug}',
            NULL,
            NULL,
            NULL,
            ${prep},
            ${cook},
            ${shelf},
            ${cost},
            1,
            NULL,
            NULL
          FROM \`menu_categories\` pc
          INNER JOIN \`menu_categories\` sc
            ON sc.\`parent_id\` = pc.\`id\` AND sc.\`slug\` = '${sqlEsc(r.subcategorySlug)}'
          WHERE pc.\`slug\` = '${sqlEsc(r.rootSlug)}' AND pc.\`parent_id\` IS NULL
          LIMIT 1
        `);
      } else {
        await queryRunner.query(`
          INSERT IGNORE INTO \`menu_items\` (
            \`category_id\`,
            \`subcategory_id\`,
            \`item_code\`,
            \`slug\`,
            \`image\`,
            \`gallery\`,
            \`video_url\`,
            \`preparation_time\`,
            \`cooking_time\`,
            \`shelf_life_hours\`,
            \`base_cost\`,
            \`is_active\`,
            \`created_by\`,
            \`updated_by\`
          )
          SELECT
            pc.\`id\`,
            NULL,
            '${code}',
            '${slug}',
            NULL,
            NULL,
            NULL,
            ${prep},
            ${cook},
            ${shelf},
            ${cost},
            1,
            NULL,
            NULL
          FROM \`menu_categories\` pc
          WHERE pc.\`slug\` = '${sqlEsc(r.rootSlug)}' AND pc.\`parent_id\` IS NULL
          LIMIT 1
        `);
      }

      await queryRunner.query(`
        INSERT IGNORE INTO \`menu_item_translations\` (
          \`menu_item_id\`,
          \`language_id\`,
          \`name\`,
          \`description\`
        )
        SELECT mi.\`id\`, l.\`id\`, '${name}', '${desc}'
        FROM \`menu_items\` mi
        INNER JOIN \`languages\` l ON l.\`code\` = 'en'
        WHERE mi.\`item_code\` = '${code}'
        LIMIT 1
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE t FROM \`menu_item_translations\` t
      INNER JOIN \`menu_items\` mi ON mi.\`id\` = t.\`menu_item_id\`
      WHERE mi.\`item_code\` LIKE 'SEED_MI_%'
    `);
    await queryRunner.query(`
      DELETE FROM \`menu_items\` WHERE \`item_code\` LIKE 'SEED_MI_%'
    `);
  }
}

function sqlEsc(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "''");
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

type SeedRow = {
  name: string;
  description: string;
  rootSlug: 'starters' | 'main-course' | 'desserts' | 'beverages';
  subcategorySlug: 'soups' | 'paneer-specials' | null;
  preparationTime: number;
  cookingTime: number;
  shelfLifeHours: number | null;
  baseCost: number;
};

function buildSeedRows(): SeedRow[] {
  const startersSoup = (
    [
      ['Tomato Shorba', 'Smoky tomato broth tempered with mild spices.', 10, 25, 24, 85],
      ['Sweet Corn Soup', 'Cream-style corn soup with pepper.', 8, 15, 24, 72],
      ['Lemon Coriander Soup', 'Clear broth with lemon and fresh coriander.', 8, 12, 18, 68],
      ['Hot & Sour Veg Soup', 'Indo-Chinese style tangy soup.', 10, 18, 24, 78],
      ['Manchow Soup', 'Crispy noodle topped spicy vegetable soup.', 12, 20, 24, 92],
      ['Tom Yum Veg', 'Lemongrass and galangal infused clear soup.', 15, 22, 18, 105],
      ['Minestrone Cup', 'Italian mixed vegetable soup.', 10, 35, 48, 120],
      ['Mushroom Cappuccino', 'Silky mushroom foam soup.', 12, 18, 24, 135],
      ['Roasted Pumpkin Soup', 'Maple hint and toasted seeds.', 15, 28, 48, 118],
      ['Spinach Almond Soup', 'Blanched spinach with almond cream.', 12, 22, 24, 112],
      ['Carrot Ginger Soup', 'Light immunity-friendly starter.', 10, 20, 36, 72],
      ['Rasam Shot', 'Classic pepper-tamarind rasam in small cups.', 6, 15, 12, 42],
      ['Clear Vegetable Broth', 'Low-oil mixed vegetable stock.', 10, 25, 36, 62],
      ['Laksa Inspired Bowl', 'Coconut curry noodle soup (veg).', 18, 28, 24, 148],
      ['Tom Kha Veg', 'Coconut milk soup with lime leaves.', 14, 22, 24, 125],
    ] as const
  ).map(([name, description, preparationTime, cookingTime, shelfLifeHours, baseCost]) => ({
    name,
    description,
    rootSlug: 'starters' as const,
    subcategorySlug: 'soups' as const,
    preparationTime,
    cookingTime,
    shelfLifeHours,
    baseCost,
  }));

  const startersOther = (
    [
      ['Vegetable Seekh Kebab', 'Charcoal grilled minced vegetable skewers.', 25, 18, 24, 165],
      ['Hara Bhara Kebab', 'Spinach and pea patties.', 20, 15, 24, 138],
      ['Paneer Tikka Bites', 'Tandoor roasted cottage cheese cubes.', 18, 14, 24, 175],
      ['Stuffed Mushrooms', 'Cheese and herb filled mushrooms baked.', 15, 18, 24, 155],
      ['Corn Cheese Balls', 'Crispy bite-sized corn and cheese.', 15, 12, 24, 122],
      ['Veg Spring Rolls', 'Crispy rolls with cabbage mix.', 15, 14, 24, 98],
      ['Dahi Ke Kebab', 'Hung yogurt patties shallow fried.', 22, 12, 24, 142],
      ['Tandoori Broccoli', 'Smoky broccoli with chaat masala.', 12, 16, 24, 158],
    ] as const
  ).map(([name, description, preparationTime, cookingTime, shelfLifeHours, baseCost]) => ({
    name,
    description,
    rootSlug: 'starters' as const,
    subcategorySlug: null,
    preparationTime,
    cookingTime,
    shelfLifeHours,
    baseCost,
  }));

  const mainsPaneer = (
    [
      ['Paneer Butter Masala', 'Tomato cashew gravy with grilled paneer.', 20, 28, 36, 245],
      ['Palak Paneer', 'Cottage cheese in silky spinach.', 18, 22, 36, 228],
      ['Paneer Lababdar', 'Rich onion tomato gravy.', 22, 26, 36, 258],
      ['Kadai Paneer', 'Capsicum onion tossed gravy.', 18, 22, 36, 238],
      ['Paneer Pasanda', 'Stuffed paneer slices in creamy sauce.', 30, 28, 36, 298],
      ['Matar Paneer', 'Peas and paneer homestyle curry.', 15, 22, 36, 208],
      ['Paneer Bhurji Meal', 'Scrambled paneer with spices.', 12, 14, 24, 185],
      ['Paneer Tikka Masala', 'Smoky tikka in makhani style gravy.', 22, 26, 36, 268],
      ['Shahi Paneer', 'White gravy with nuts and cream.', 22, 24, 36, 278],
      ['Paneer Kolhapuri', 'Spicy Kolhapuri onion gravy.', 20, 26, 36, 252],
      ['Paneer Bhuna Masala', 'Dryish roasted masala coat.', 18, 24, 36, 242],
      ['Paneer Do Pyaza', 'Double onion tangy curry.', 16, 22, 36, 232],
      ['Malai Kofta Curry', 'Soft dumplings in mild gravy.', 35, 28, 36, 268],
      ['Paneer Methi Malai', 'Fenugreek leaves and cream.', 18, 22, 36, 248],
      ['Paneer Jalfrezi', 'Stir-fry gravy with peppers.', 16, 18, 36, 228],
      ['Paneer Rajma Bowl', 'Kidney beans and paneer combo curry.', 18, 35, 48, 218],
      ['Paneer Lazeez Handi', 'Clay-pot finish creamy gravy.', 24, 26, 36, 288],
      ['Paneer Hara Pyaza', 'Mint coriander green gravy.', 18, 22, 36, 238],
      ['Paneer Dhaniya Adrak', 'Coriander ginger forward gravy.', 17, 21, 36, 235],
      ['Paneer Achari', 'Pickling spices tangy gravy.', 18, 23, 36, 248],
      ['Paneer Mushroom Masala', 'Paneer with button mushrooms.', 18, 24, 36, 258],
      ['Paneer Curry Combo', 'Chef choice gravy with paneer.', 20, 25, 36, 252],
    ] as const
  ).map(([name, description, preparationTime, cookingTime, shelfLifeHours, baseCost]) => ({
    name,
    description,
    rootSlug: 'main-course' as const,
    subcategorySlug: 'paneer-specials' as const,
    preparationTime,
    cookingTime,
    shelfLifeHours,
    baseCost,
  }));

  const mainsOther = (
    [
      ['Dal Makhani Meal', 'Slow cooked black lentils.', 20, 55, 48, 195],
      ['Chole Bhature Tray', 'Spiced chickpeas with fried bread.', 25, 35, 24, 165],
      ['Veg Dum Biryani', 'Layered basmati with mixed vegetables.', 35, 45, 36, 215],
      ['Malabar Veg Curry', 'Coconut milk coastal curry.', 22, 28, 36, 205],
      ['Baingan Bharta Meal', 'Roasted eggplant mash.', 20, 35, 36, 178],
      ['Bhindi Masala Bowl', 'Okra onion tomato stir gravy.', 15, 22, 36, 162],
      ['Mixed Veg Handi', 'Seasonal vegetables medium gravy.', 18, 24, 36, 188],
      ['Jeera Pulao Combo', 'Cumin rice with kadhi.', 12, 28, 36, 155],
      ['Rajma Chawal Box', 'Kidney bean curry with rice.', 15, 40, 48, 148],
      ['Undhiyu Festive Tray', 'Gujarati winter vegetable medley.', 45, 50, 24, 225],
      ['Navratan Korma', 'Nine jewel creamy curry.', 28, 28, 36, 248],
      ['Subz Miloni', 'Five vegetable homestyle curry.', 18, 26, 36, 198],
      ['Veg Kadhai', 'Wok tossed gravy with capsicum.', 16, 22, 36, 208],
      ['Stuffed Capsicum Curry', 'Potato paneer stuffed bells.', 25, 35, 36, 218],
      ['Jackfruit Curry Meal', 'Young jackfruit pepper gravy.', 25, 42, 36, 228],
      ['Masala Khichdi Bowl', 'Comfort lentils rice with ghee.', 10, 35, 24, 142],
      ['Veg Kolhapuri Plate', 'Very spicy mixed veg gravy.', 18, 26, 36, 212],
      ['Gatte Ki Sabzi Combo', 'Rajasthani gram flour dumplings.', 22, 38, 36, 188],
    ] as const
  ).map(([name, description, preparationTime, cookingTime, shelfLifeHours, baseCost]) => ({
    name,
    description,
    rootSlug: 'main-course' as const,
    subcategorySlug: null,
    preparationTime,
    cookingTime,
    shelfLifeHours,
    baseCost,
  }));

  const desserts = (
    [
      ['Gulab Jamun Rabdi', 'Warm dumplings with thickened milk.', 10, 25, 72, 115],
      ['Rasmalai Chef Slice', 'Chenna discs in saffron milk.', 15, 35, 48, 125],
      ['Kesar Phirni Cups', 'Ground rice pudding chilled.', 15, 45, 72, 98],
      ['Brownie Sundae', 'Chocolate brownie with ice cream.', 12, 15, 24, 145],
      ['Gajar Halwa Bowl', 'Carrot pudding with nuts.', 20, 55, 72, 108],
      ['Moong Dal Halwa Mini', 'Rich lentil dessert.', 25, 50, 72, 132],
      ['Fruit Custard Cup', 'Seasonal fruits in custard.', 15, 12, 24, 88],
      ['Shrikhand Mango', 'Strained yogurt mango swirl.', 15, 0, 48, 112],
      ['Kulfi Trio Platter', 'Pista malai rose kulfi.', 20, 15, 72, 138],
      ['Besan Ladoo Box', 'Classic gram flour ladoos.', 15, 22, 168, 92],
    ] as const
  ).map(([name, description, preparationTime, cookingTime, shelfLifeHours, baseCost]) => ({
    name,
    description,
    rootSlug: 'desserts' as const,
    subcategorySlug: null,
    preparationTime,
    cookingTime,
    shelfLifeHours,
    baseCost,
  }));

  const beverages = (
    [
      ['Masala Chaas Jug', 'Spiced buttermilk.', 8, 0, 24, 42],
      ['Sweet Lassi Glass', 'Rose cardamom yogurt drink.', 10, 0, 24, 58],
      ['Fresh Lime Soda', 'Sweet salted lime cooler.', 6, 0, 12, 52],
      ['Jaljeera Spritzer', 'Tamarind cumin cooler.', 8, 0, 24, 48],
      ['Masala Chai Flask', 'Strong tea with spices.', 6, 15, 12, 38],
      ['Cold Coffee Shake', 'Blended coffee with ice cream.', 10, 5, 24, 78],
      ['Badam Milk Warm', 'Almond saffron milk.', 12, 18, 24, 92],
      ['Aam Panna Pitcher', 'Raw mango summer cooler.', 15, 15, 72, 68],
    ] as const
  ).map(([name, description, preparationTime, cookingTime, shelfLifeHours, baseCost]) => ({
    name,
    description,
    rootSlug: 'beverages' as const,
    subcategorySlug: null,
    preparationTime,
    cookingTime,
    shelfLifeHours,
    baseCost,
  }));

  return [
    ...startersSoup,
    ...startersOther,
    ...mainsPaneer,
    ...mainsOther,
    ...desserts,
    ...beverages,
  ];
}
