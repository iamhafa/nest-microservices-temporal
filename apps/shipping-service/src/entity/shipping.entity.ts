import { DeliveryStatus } from '@libs/contract/shipping/enum/delivery-status.enum';
import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('shippings')
export class ShippingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, comment: 'Mã đơn hàng liên kết' })
  order_id: number;

  @Column({ comment: 'Địa chỉ giao hàng' })
  address: string;

  @Column({ type: 'enum', enum: DeliveryStatus, default: DeliveryStatus.PENDING })
  status: DeliveryStatus;

  @Column({ nullable: true, comment: 'Mã vận đơn thực tế (nếu dùng bưu điện)' })
  tracking_code: string;

  @CreateDateColumn({ select: false })
  created_at_utc: Date;

  @UpdateDateColumn({ select: false })
  updated_at_utc: Date;

  @DeleteDateColumn({ select: false })
  deleted_at_utc: Date;
}
