import { InjectStripeClient } from '@golevelup/nestjs-stripe';
import { AppException } from '@libs/common/exception/app-exception';
import { PaymentErrorCode } from '@libs/contract/payment/error';
import { IPaymentActivity } from '@libs/temporal/activity';
import { Logger } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { Stripe } from 'stripe';
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
  async chargePayment(orderId: number, totalAmount: number): Promise<number> {
    this.logger.log(`[Order ${orderId}] Charging payment: ${totalAmount} VND`);

    const existingTransaction = await this.paymentTransactionRepository.findOne({
      where: {
        order_id: orderId,
        status: PaymentStatus.SUCCESS,
      },
      select: {
        id: true,
      },
    });

    if (existingTransaction instanceof PaymentTransactionEntity) {
      this.logger.log(`[Order ${orderId}] Payment was already successfully charged in a previous attempt.`);
      return existingTransaction.id;
    }

    const paymentIntent = await this.stripeClient.paymentIntents.create(
      {
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
      },
      {
        idempotencyKey: `charge_order_${orderId}`,
      },
    );

    if (paymentIntent.status !== 'succeeded') {
      throw new AppException({
        code: PaymentErrorCode.PROCESSING_FAILED,
        message: `[Order ${orderId}] Payment failed: ${paymentIntent.status}`,
      });
    }

    const paymentTransaction: PaymentTransactionEntity = this.paymentTransactionRepository.create({
      order_id: orderId,
      stripe_payment_id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: PaymentStatus.SUCCESS,
    });

    // Log the transaction
    await this.paymentTransactionRepository.save(paymentTransaction);

    this.logger.log(`[Order ${orderId}] Payment successful: ${paymentIntent.id}`);
    return paymentTransaction.id;
  }

  @ActivityMethod()
  async refundPayment(paymentId: number): Promise<void> {
    this.logger.warn(`[Payment ${paymentId}] Refunding payment...`);

    // Check if the payment is already refunded
    const existingTransaction = await this.paymentTransactionRepository.findOne({
      where: {
        id: paymentId,
      },
      select: {
        status: true,
      },
    });

    if (existingTransaction && existingTransaction.status === PaymentStatus.REFUNDED) {
      this.logger.log(`Payment ${paymentId} was already refunded.`);
      return;
    }

    // Get the payment
    const payment = await this.paymentTransactionRepository.findOneOrFail({
      where: {
        id: paymentId,
      },
      select: {
        stripe_payment_id: true,
      },
    });

    // Create the refund
    const refund = await this.stripeClient.refunds.create(
      {
        payment_intent: payment.stripe_payment_id,
      },
      {
        idempotencyKey: `refund_payment_${paymentId}`,
      },
    );

    if (refund.status !== 'succeeded') {
      throw new AppException({
        code: PaymentErrorCode.PROCESSING_FAILED,
        message: `[Payment ${paymentId}] Refund failed: ${refund.status}`,
      });
    }

    // Update the transaction status on refund
    await this.paymentTransactionRepository.update(paymentId, {
      status: PaymentStatus.REFUNDED,
    });

    this.logger.log(`Refund created: ${refund.id} for payment ${paymentId}`);
  }
}
