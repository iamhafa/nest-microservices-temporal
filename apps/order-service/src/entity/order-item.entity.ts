import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { OrderEntity } from './order.entity';

@Entity('order_items')
export class OrderItemEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  product_id: string;

  @Column()
  quantity: number;

  @Column()
  price: number;

  @ManyToOne(() => OrderEntity, order => order.items)
  order: Relation<OrderEntity>;
}
