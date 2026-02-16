import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

@Entity('inventories')
export class InventoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, comment: 'Mã sản phẩm' })
  product_id: number;

  @Column({ type: 'int', default: 0, comment: 'Số lượng tồn kho' })
  stock: number;

  /**
   * Số lượng đang được giữ tạm thời cho các đơn hàng đang xử lý.
   * Đây là chìa khóa để triển khai Saga Pattern thành công.
   */
  @Column({ type: 'int', default: 0, comment: 'Số lượng tạm giữ' })
  reserved_quantity: number;

  @Column({ nullable: true, comment: 'Vị trí kho' })
  warehouse_location: string;

  /**
   * Optimistic Locking (Khóa lạc quan)
   * Giúp ngăn chặn lỗi khi 2 request cùng trừ kho một lúc.
   * TypeORM sẽ tự động kiểm tra version này.
   */
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
