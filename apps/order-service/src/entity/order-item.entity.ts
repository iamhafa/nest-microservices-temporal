import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { OrderEntity } from './order.entity';

@Entity('order_items')
export class OrderItemEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  product_id: number;

  @Column()
  order_id: number;

  @Column()
  quantity: number;

  @Column()
  price: number;

  @CreateDateColumn({ select: false })
  created_at_utc: Date;

  @UpdateDateColumn({ select: false })
  updated_at_utc: Date;

  @DeleteDateColumn({ select: false })
  deleted_at_utc: Date;

  @ManyToOne(() => OrderEntity, order => order.items)
  @JoinColumn({ name: 'order_id' })
  readonly order: Relation<OrderEntity>;
}
