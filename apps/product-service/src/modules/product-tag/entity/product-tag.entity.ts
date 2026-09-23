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
  ManyToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { ProductEntity } from '../../product/entity/product.entity';

@Entity('product_tags')
@Index('idx_tag_slug', ['slug'], { unique: true })
export class ProductTagEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string;

  @CreateDateColumn({ select: false })
  created_at_utc: Date;

  @UpdateDateColumn({ select: false })
  updated_at_utc: Date;

  @DeleteDateColumn({ select: false })
  deleted_at_utc: Date;

  @ManyToMany(() => ProductEntity, (product) => product.tags)
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
