import { OrderStatus } from '@libs/contract/order/enum/order-status.enum';
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

  @Column({ nullable: true })
  payment_id: string;

  @Column({ type: 'int', default: 0 })
  total_amount: number;

  @Column({ type: 'text', nullable: true, comment: 'Reason for order cancellation' })
  cancel_reason: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  @OneToMany(() => OrderItemEntity, item => item.order, { cascade: true })
  readonly items: Relation<OrderItemEntity[]>;

  get isCancelable(): boolean {
    return this.status === OrderStatus.PENDING || this.status === OrderStatus.PAID;
  }
}
