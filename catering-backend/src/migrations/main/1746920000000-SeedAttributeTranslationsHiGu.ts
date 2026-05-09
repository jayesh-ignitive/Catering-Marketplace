import { MigrationInterface, QueryRunner } from 'typeorm';

/** Hindi + Gujarati labels for catalog attributes (aligned with English seed). */
const ATTRIBUTE_I18N: ReadonlyArray<{
  type: string;
  code: string;
  hi: string;
  gu: string;
}> = [
  { type: 'cuisine', code: 'PUNJABI', hi: 'पंजाबी', gu: 'પંજાબી' },
  { type: 'cuisine', code: 'GUJARATI', hi: 'गुजराती', gu: 'ગુજરાતી' },
  { type: 'cuisine', code: 'SOUTH_INDIAN', hi: 'दक्षिण भारतीय', gu: 'દક્ષિણ ભારતીય' },
  { type: 'cuisine', code: 'NORTH_INDIAN', hi: 'उत्तर भारतीय', gu: 'ઉત્તર ભારતીય' },
  { type: 'cuisine', code: 'CHINESE', hi: 'चाइनीज़', gu: 'ચાઇનીઝ' },
  { type: 'cuisine', code: 'ITALIAN', hi: 'इटालियन', gu: 'ઇટાલિયન' },
  { type: 'dietary', code: 'VEG', hi: 'शाकाहारी', gu: 'શાકાહારી' },
  { type: 'dietary', code: 'NON_VEG', hi: 'मांसाहारी', gu: 'માંસાહારી' },
  { type: 'dietary', code: 'JAIN', hi: 'जैन', gu: 'જૈન' },
  { type: 'dietary', code: 'VEGAN', hi: 'वीगन', gu: 'વીગન' },
  { type: 'service', code: 'BUFFET', hi: 'बुफे', gu: 'બુફે' },
  { type: 'service', code: 'LIVE_COUNTER', hi: 'लाइव काउंटर', gu: 'લાઇવ કાઉન્ટર' },
  { type: 'service', code: 'PLATED', hi: 'प्लेट सर्विस', gu: 'પ્લેટ સર્વિસ' },
  { type: 'spice', code: 'MILD', hi: 'हल्का', gu: 'હલકું' },
  { type: 'spice', code: 'MEDIUM', hi: 'मध्यम', gu: 'મધ્યમ' },
  { type: 'spice', code: 'SPICY', hi: 'तीखा', gu: 'તીખું' },
  { type: 'meal_time', code: 'BREAKFAST', hi: 'नाश्ता', gu: 'નાસ્તો' },
  { type: 'meal_time', code: 'LUNCH', hi: 'लंच', gu: 'લંચ' },
  { type: 'meal_time', code: 'DINNER', hi: 'डिनर', gu: 'ડિનર' },
  { type: 'event', code: 'WEDDING', hi: 'शादी', gu: 'લગ્ન' },
  { type: 'event', code: 'CORPORATE', hi: 'कॉर्पोरेट', gu: 'કોર્પોરેટ' },
  { type: 'event', code: 'BIRTHDAY', hi: 'जन्मदिन', gu: 'જન્મદિન' },
  { type: 'audience', code: 'KIDS', hi: 'बच्चे', gu: 'બાળકો' },
  { type: 'audience', code: 'FAMILY', hi: 'परिवार', gu: 'પરિવાર' },
  { type: 'preparation', code: 'FRIED', hi: 'तला हुआ', gu: 'તળેલું' },
  { type: 'preparation', code: 'BAKED', hi: 'बेक्ड', gu: 'બેક કરેલું' },
  { type: 'preparation', code: 'GRILLED', hi: 'ग्रिल्ड', gu: 'ગ્રિલ્ડ' },
  { type: 'temperature', code: 'HOT', hi: 'गर्म', gu: 'ગરમ' },
  { type: 'temperature', code: 'COLD', hi: 'ठंडा', gu: 'ઠંડું' },
  { type: 'course', code: 'STARTER', hi: 'स्टार्टर', gu: 'સ્ટાર્ટર' },
  { type: 'course', code: 'MAIN_COURSE', hi: 'मुख्य व्यंजन', gu: 'મુખ્ય વ્યંજન' },
  { type: 'course', code: 'DESSERT', hi: 'मिठाई', gu: 'મીઠાઈ' },
  { type: 'food_category', code: 'PREMIUM', hi: 'प्रीमियम', gu: 'પ્રીમિયમ' },
  { type: 'food_category', code: 'REGULAR', hi: 'सामान्य', gu: 'સામાન્ય' },
  { type: 'season', code: 'SUMMER', hi: 'गर्मी', gu: 'ઉનાળો' },
  { type: 'season', code: 'WINTER', hi: 'सर्दी', gu: 'શિયાળો' },
  { type: 'recommendation', code: 'BESTSELLER', hi: 'बेस्टसेलर', gu: 'બેસ્ટસેલર' },
  { type: 'recommendation', code: 'TRENDING', hi: 'ट्रेंडिंग', gu: 'ટ્રેન્ડિંગ' },
  { type: 'package_type', code: 'SILVER', hi: 'सिल्वर', gu: 'સિલ્વર' },
  { type: 'package_type', code: 'GOLD', hi: 'गोल्ड', gu: 'ગોલ્ડ' },
  { type: 'counter_type', code: 'CHAAT_COUNTER', hi: 'चाट काउंटर', gu: 'ચાટ કાઉન્ટર' },
  { type: 'counter_type', code: 'PASTA_COUNTER', hi: 'पास्ता काउंटर', gu: 'પાસ્તા કાઉન્ટર' },
  { type: 'beverage_type', code: 'MOCKTAIL', hi: 'मॉकटेल', gu: 'મોકટેલ' },
  { type: 'beverage_type', code: 'TEA', hi: 'चाय', gu: 'ચા' },
  { type: 'portion', code: 'MINI', hi: 'मिनी', gu: 'મિની' },
  {
    type: 'portion',
    code: 'REGULAR',
    hi: 'रेगुलर पोर्शन',
    gu: 'રેગ્યુલર પોર્શન',
  },
];

export class SeedAttributeTranslationsHiGu1746920000000 implements MigrationInterface {
  name = 'SeedAttributeTranslationsHiGu1746920000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const sql = `
      INSERT INTO \`attribute_translations\` (\`attribute_id\`, \`language_id\`, \`name\`)
      SELECT a.\`id\`, l.\`id\`, ?
      FROM \`attributes\` a
      INNER JOIN \`languages\` l ON l.\`code\` = ? AND (l.\`deleted_at\` IS NULL)
      WHERE a.\`type\` = ? AND a.\`code\` = ? AND (a.\`deleted_at\` IS NULL)
      ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`)
    `;

    for (const row of ATTRIBUTE_I18N) {
      await queryRunner.query(sql, [row.hi, 'hi', row.type, row.code]);
      await queryRunner.query(sql, [row.gu, 'gu', row.type, row.code]);
    }
  }

  public async down(): Promise<void> {
    /* Optional: would remove only seeded hi/gu rows; skipped to avoid deleting admin edits. */
  }
}
