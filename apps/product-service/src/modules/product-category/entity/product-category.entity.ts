import { randomBytes } from 'crypto';
import slugify from 'slugify';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { ProductEntity } from '../../product/entity/product.entity';

@Entity('product_categories')
@Index('idx_category_slug', ['slug'], { unique: true })
export class ProductCategoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ select: false })
  created_at_utc: Date;

  @UpdateDateColumn({ select: false })
  updated_at_utc: Date;

  @DeleteDateColumn({ select: false })
  deleted_at_utc: Date;

  @OneToMany(() => ProductEntity, (product) => product.category)
  readonly products: Relation<ProductEntity[]>;

  @BeforeInsert()
  @BeforeUpdate()
  updateSlug() {
    const baseSlug: string = slugify(this.name, {
      lower: true,
      strict: true,
      trim: true,
    });
    const randomSuffix: string = randomBytes(6).toString('hex');
    this.slug = `${baseSlug}-${randomSuffix}`;
  }
}
