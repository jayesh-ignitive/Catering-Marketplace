import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('blog_posts')
export class BlogPost {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 160, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  /** Overrides document title when set (max ~60 chars recommended). */
  @Column({ name: 'meta_title', type: 'varchar', length: 70, nullable: true })
  metaTitle!: string | null;

  @Column({ type: 'varchar', length: 500 })
  excerpt!: string;

  /** Overrides meta description when set. */
  @Column({
    name: 'meta_description',
    type: 'varchar',
    length: 320,
    nullable: true,
  })
  metaDescription!: string | null;

  @Column({ name: 'body_html', type: 'mediumtext' })
  bodyHtml!: string;

  @Column({
    name: 'category_label',
    type: 'varchar',
    length: 64,
    default: 'Insights',
  })
  categoryLabel!: string;

  @Column({
    name: 'featured_image_url',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  featuredImageUrl!: string | null;

  /** Open Graph / Twitter image override. */
  @Column({ name: 'og_image_url', type: 'varchar', length: 512, nullable: true })
  ogImageUrl!: string | null;

  @Column({ name: 'published_at', type: 'datetime' })
  publishedAt!: Date;

  @Column({ name: 'is_published', type: 'boolean', default: true })
  isPublished!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;
}
