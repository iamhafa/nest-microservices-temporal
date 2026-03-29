import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { ProductBrandEntity } from './product-brand.entity';
import { ProductCategoryEntity } from './product-category.entity';
import { ProductTagEntity } from './product-tag.entity';

@Entity('products')
export class ProductEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: 'Tên sản phẩm' })
  name: string;

  @Column({ type: 'text', nullable: true, comment: 'Mô tả sản phẩm' })
  description: string;

  @Column({ nullable: true })
  category_id: number;

  @Column({ nullable: true })
  brand_id: number;

  @Column({ comment: 'Giá sản phẩm' })
  price: number;

  @Column({ default: 'VND', comment: 'Đơn vị tiền tệ' })
  currency: string;

  @Column({ nullable: true, comment: 'Đường dẫn ảnh sản phẩm' })
  image_url: string;

  @Column({ type: 'boolean', default: true, comment: 'Sản phẩm còn hoạt động' })
  is_active: boolean;

  @Column({ type: 'jsonb', nullable: true, default: {}, comment: 'Thuộc tính động (màu sắc, cấu hình...)' })
  attributes: Record<string, string>;

  @VersionColumn({
    comment: 'Phiên bản khóa lạc quan (Optimistic Locking) dùng để ngăn chặn tranh chấp dữ liệu (Race Condition).',
  })
  version: number;

  @CreateDateColumn({ select: false })
  created_at: Date;

  @UpdateDateColumn({ select: false })
  updated_at: Date;

  @DeleteDateColumn({ select: false })
  deleted_at: Date;

  @ManyToOne(() => ProductCategoryEntity, category => category.products)
  @JoinColumn({ name: 'category_id' })
  readonly category: Relation<ProductCategoryEntity>;

  @ManyToMany(() => ProductTagEntity, tag => tag.products)
  @JoinTable({
    name: 'products_tags_link',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  readonly tags: Relation<ProductTagEntity[]>;

  @ManyToOne(() => ProductBrandEntity, brand => brand.products)
  @JoinColumn({ name: 'brand_id' })
  readonly brand: Relation<ProductBrandEntity>;
}
