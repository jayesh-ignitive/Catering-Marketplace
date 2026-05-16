import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Attribute } from './attribute.entity';
import { MenuItem } from './menu-item.entity';

@Entity('menu_item_attributes')
@Unique('UQ_menu_item_attribute_pair', ['menuItem', 'attribute'])
export class MenuItemAttribute {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @ManyToOne(() => MenuItem, (item) => item.attributeLinks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'menu_item_id' })
  menuItem!: MenuItem;

  @ManyToOne(() => Attribute, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attribute_id' })
  attribute!: Attribute;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;
}
