import { OrderStatus } from '@libs/contract/order/enum/order-status.enum';
import {
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
import { OrderItemEntity } from './order-item.entity';

@Entity('orders')
@Index('idx_order_user_id', ['user_id'])
@Index('idx_order_payment_id', ['payment_id'])
@Index('idx_order_status', ['status'])
export class OrderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, comment: 'ID của user, null nếu mua hàng không cần đăng nhập' })
  user_id: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column()
  address: string;

  @Column()
  email: string;

  @Column({ unique: true, nullable: true, comment: 'Mã thanh toán' })
  payment_id: number;

  @Column({ type: 'int', default: 0, comment: 'Tổng tiền đơn hàng' })
  total_amount: number;

  @Column({ type: 'text', nullable: true, comment: 'Lý do hủy đơn hàng' })
  cancel_reason: string;

  @CreateDateColumn({ select: false })
  created_at_utc: Date;

  @UpdateDateColumn({ select: false })
  updated_at_utc: Date;

  @DeleteDateColumn({ select: false })
  deleted_at_utc: Date;

  @OneToMany(() => OrderItemEntity, (item) => item.order, { cascade: true })
  readonly items: Relation<OrderItemEntity[]>;

  get isCancelable(): boolean {
    return this.status === OrderStatus.PENDING || this.status === OrderStatus.PAID;
  }
}
