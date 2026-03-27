import { InjectStripeClient } from '@golevelup/nestjs-stripe';
import { IPaymentActivity } from '@libs/temporal/activity';
import { Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import Stripe from 'stripe';
import { PaymentStatus, PaymentTransactionEntity } from '../entity/payment-transaction.entity';
import { PaymentTransactionRepository } from '../repository/payment-transaction.repository';

@Activity()
export class PaymentActivities implements IPaymentActivity {
  private readonly logger = new Logger(PaymentActivities.name);

  constructor(
    @InjectStripeClient() private readonly stripeClient: Stripe,
    private readonly paymentTransactionRepository: PaymentTransactionRepository,
  ) {}

  @ActivityMethod()
  async chargePayment(orderId: number, totalAmount: number): Promise<string> {
    this.logger.log(`[Order ${orderId}] Charging payment: ${totalAmount} VND`);

    const paymentIntent = await this.stripeClient.paymentIntents.create({
      amount: totalAmount,
      currency: 'vnd',
      payment_method: 'pm_card_visa',
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      metadata: {
        order_id: orderId,
      },
    });

    const paymentTransaction: PaymentTransactionEntity = this.paymentTransactionRepository.create({
      order_id: orderId,
      stripe_payment_id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status === 'succeeded' ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
      error_message: paymentIntent.status === 'succeeded' ? undefined : `Stripe status: ${paymentIntent.status}`,
    });

    // Log the transaction
    await this.paymentTransactionRepository.save(paymentTransaction);

    if (paymentIntent.status !== 'succeeded') {
      throw new RpcException(`[Order ${orderId}] Payment failed: ${paymentIntent.status}`);
    }

    this.logger.log(`[Order ${orderId}] Payment successful: ${paymentIntent.id}`);
    return paymentIntent.id;
  }

  @ActivityMethod()
  async refundPayment(paymentId: string): Promise<void> {
    this.logger.warn(`Refunding payment: ${paymentId}`);

    const refund = await this.stripeClient.refunds.create({
      payment_intent: paymentId,
    });

    // Update the transaction status on refund
    await this.paymentTransactionRepository.update(paymentId, { status: PaymentStatus.REFUNDED });

    this.logger.log(`Refund created: ${refund.id} for payment ${paymentId}`);
  }
}
