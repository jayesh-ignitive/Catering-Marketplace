import { MigrationInterface, QueryRunner } from 'typeorm';

export class BlogPosts1743500000000 implements MigrationInterface {
  name = 'BlogPosts1743500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`blog_posts\` (
        \`id\` char(36) NOT NULL,
        \`slug\` varchar(160) NOT NULL,
        \`title\` varchar(255) NOT NULL,
        \`excerpt\` varchar(500) NOT NULL,
        \`body_html\` mediumtext NOT NULL,
        \`category_label\` varchar(64) NOT NULL DEFAULT 'Insights',
        \`featured_image_url\` varchar(512) NULL,
        \`published_at\` datetime NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_blog_posts_slug\` (\`slug\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      INSERT INTO \`blog_posts\`
        (\`id\`, \`slug\`, \`title\`, \`excerpt\`, \`body_html\`, \`category_label\`, \`featured_image_url\`, \`published_at\`)
      VALUES
      (
        'a1000001-0000-4000-8000-000000000001',
        'wedding-catering-trends-2025',
        'Top Catering Trends for Weddings in 2025',
        'Interactive live stations, hyper-local menus, and sustainability-led buffets—what couples are booking this season.',
        '<p>Weddings in India are leaning toward <strong>experience-first dining</strong>: guests want live counters, chef interactions, and Instagram-worthy plating without sacrificing portion sizes.</p><p>Regional menus paired with one fusion anchor course are replacing generic multi-cuisine spreads. Caterers who publish clear tasting timelines and dietary lanes (Jain, vegan, nut-free) win more inquiries.</p><p>When you shortlist on Bharat Catering, compare menus side by side and ask for a pilot tasting before you lock dates.</p>',
        'Trends',
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80',
        '2025-01-15 10:00:00'
      ),
      (
        'a1000001-0000-4000-8000-000000000002',
        'corporate-event-menu-guide',
        'How to Choose the Right Menu for Corporate Events',
        'Balance dietary diversity, service speed, and budget—without another spreadsheet.',
        '<p>For working lunches, <strong>box meals with labeled allergens</strong> reduce queue time. For town-halls and awards nights, plated or assisted buffets keep the room quiet during speeches.</p><p>Ask your caterer for portion models (per plate vs per guest bundles) and backup quantities for 8–10% attendance variance.</p><p>Use city + service filters on our directory to find teams that routinely service your office geography.</p>',
        'Guide',
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80',
        '2025-02-01 12:00:00'
      ),
      (
        'a1000001-0000-4000-8000-000000000003',
        'choosing-caterer-checklist',
        'A Practical Checklist Before You Sign a Caterer',
        'Hygiene certifications, staffing ratios, rain plans, and payment milestones—capture them up front.',
        '<p>Request <strong>FSSAI</strong> and kitchen audit context, not just photos. Confirm service staff count per guest band and overtime rules for delayed baraats or late-night corporate wrap-ups.</p><p>Clarify logistics: generator, water, lift access, and who handles rentals. Put cancellation and postponement clauses in writing.</p><p>Profiles on Bharat Catering highlight specialties and indicative pricing—use them to prep your first call.</p>',
        'Planning',
        'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80',
        '2025-02-20 09:30:00'
      ),
      (
        'a1000001-0000-4000-8000-000000000004',
        'regional-indian-feast-ideas',
        'Regional Indian Feasts Guests Still Talk About',
        'From Malabar seafood to Rajasthani dal-baati—build a cohesive menu story across courses.',
        '<p>Instead of mixing every region on one plate, anchor a <strong>single regional story</strong> with one optional fusion interlude. Pair heavy mains with lighter counters so energy stays high on the dance floor.</p><p>For outdoor events, plan hold-and-serve workflows so chaat and grills stay crisp. Your caterer should map wind, power, and monsoon contingencies.</p>',
        'Inspiration',
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
        '2025-03-08 14:00:00'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`blog_posts\``);
  }
}
