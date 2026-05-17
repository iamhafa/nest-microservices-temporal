import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { ProductEntity } from './product.entity';

@Entity('product_images')
export class ProductImageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: 'Đường dẫn ảnh trên S3' })
  image_url: string;

  @Column({ default: false, comment: 'Đánh dấu là ảnh chính (thumbnail)' })
  is_thumbnail: boolean;

  @Column()
  product_id: number;

  @CreateDateColumn({ select: false })
  created_at_utc: Date;

  @UpdateDateColumn({ select: false })
  updated_at_utc: Date;

  @ManyToOne(() => ProductEntity, product => product.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  readonly product: Relation<ProductEntity>;
}
