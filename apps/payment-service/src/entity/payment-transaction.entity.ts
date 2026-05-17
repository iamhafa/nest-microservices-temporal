import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

@Entity('payment_transactions')
export class PaymentTransactionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, comment: 'The ID of the workflow or order' })
  order_id: number;

  @Column({ unique: true, comment: 'Stripe Payment Intent ID' })
  stripe_payment_id: string;

  @Column({ comment: 'Amount in smallest currency unit (e.g. USD)' })
  amount: number;

  @Column({ default: 'usd' })
  currency: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'text', nullable: true, comment: 'Error message if payment failed' })
  error_message: string;

  @CreateDateColumn({ select: false })
  created_at_utc: Date;

  @UpdateDateColumn({ select: false })
  updated_at_utc: Date;

  @DeleteDateColumn({ select: false })
  deleted_at_utc: Date;
}
