import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('blog_posts')
export class BlogPost {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 160, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 500 })
  excerpt!: string;

  @Column({ name: 'body_html', type: 'mediumtext' })
  bodyHtml!: string;

  /** Short label shown on cards e.g. Trends, Guide */
  @Column({ name: 'category_label', type: 'varchar', length: 64, default: 'Insights' })
  categoryLabel!: string;

  @Column({ name: 'featured_image_url', type: 'varchar', length: 512, nullable: true })
  featuredImageUrl!: string | null;

  @Column({ name: 'published_at', type: 'datetime' })
  publishedAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;
}
