import { OrderStatus } from '@libs/contract/order/enum';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItemEntity } from './order-item.entity';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column()
  address: string;

  @Column()
  email: string;

  @Column({ unique: true, nullable: true, comment: 'Mã thanh toán' })
  payment_id: string;

  @Column({ type: 'int', default: 0, comment: 'Tổng tiền đơn hàng' })
  total_amount: number;

  @Column({ type: 'text', nullable: true, comment: 'Lý do hủy đơn hàng' })
  cancel_reason: string;

  @CreateDateColumn({ select: false })
  created_at: Date;

  @UpdateDateColumn({ select: false })
  updated_at: Date;

  @DeleteDateColumn({ select: false })
  deleted_at: Date;

  @OneToMany(() => OrderItemEntity, item => item.order, { cascade: true })
  readonly items: Relation<OrderItemEntity[]>;

  get isCancelable(): boolean {
    return this.status === OrderStatus.PENDING || this.status === OrderStatus.PAID;
  }
}
