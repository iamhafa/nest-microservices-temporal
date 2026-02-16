import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

@Entity('products')
export class ProductEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: 'Tên sản phẩm' })
  name: string;

  @Column({ type: 'text', nullable: true, comment: 'Mô tả sản phẩm' })
  description: string;

  @Column({ type: 'int', comment: 'Giá sản phẩm (VND)' })
  price: number;

  @Column({ nullable: true, comment: 'Đường dẫn ảnh sản phẩm' })
  image_url: string;

  @Column({ type: 'boolean', default: true, comment: 'Sản phẩm còn hoạt động' })
  is_active: boolean;

  @VersionColumn({
    comment: 'Phiên bản khóa lạc quan (Optimistic Locking) dùng để ngăn chặn tranh chấp dữ liệu (Race Condition).',
  })
  version: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}
