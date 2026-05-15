import { InjectStripeClient } from '@golevelup/nestjs-stripe';
import { AppException } from '@libs/common/exception/app-exception';
import { PaymentErrorCode } from '@libs/contract/payment/error';
import { IPaymentActivity } from '@libs/temporal/activity';
import { HttpStatus, Logger } from '@nestjs/common';
import {
  BrokenCircuitError,
  circuitBreaker,
  CircuitBreakerPolicy,
  ConsecutiveBreaker,
  ExponentialBackoff,
  handleAll,
} from 'cockatiel';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { Stripe } from 'stripe';
import { PaymentStatus, PaymentTransactionEntity } from '../entity/payment-transaction.entity';
import { PaymentTransactionRepository } from '../repository/payment-transaction.repository';

@Activity()
export class PaymentActivities implements IPaymentActivity {
  private readonly logger = new Logger(PaymentActivities.name);

  private readonly circuitBreaker: CircuitBreakerPolicy = circuitBreaker(handleAll, {
    halfOpenAfter: new ExponentialBackoff(), // thời gian chờ giữa các lần thử lại khi mạch đang mở sẽ tăng dần (ví dụ: 1s, 2s, 4s...)
    breaker: new ConsecutiveBreaker(5), // open if 5 consecutive errors
  });

  constructor(
    @InjectStripeClient() private readonly stripeClient: Stripe,
    private readonly paymentTransactionRepository: PaymentTransactionRepository,
  ) {
    this.circuitBreaker.onBreak(() => this.logger.warn('--- [Stripe] Circuit Breaker OPEN! ---'));
    this.circuitBreaker.onReset(() => this.logger.log('--- [Stripe] Circuit Breaker CLOSED! ---'));
  }

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

    try {
      const paymentIntent: Stripe.PaymentIntent = await this.circuitBreaker.execute(() => {
        return this.stripeClient.paymentIntents.create(
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
      });

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
      const savedPaymentTransaction = await this.paymentTransactionRepository.save(paymentTransaction);

      this.logger.log(`[Order ${orderId}] Payment successful: ${paymentIntent.id}`);
      return savedPaymentTransaction.id;
    } catch (error) {
      if (error instanceof BrokenCircuitError) {
        this.logger.error(`[Order ${orderId}] Stripe API is failing fast due to Broken Circuit.`);
        throw new AppException({
          code: PaymentErrorCode.PROCESSING_FAILED,
          message: 'Stripe service is temporarily unavailable (Circuit Breaker)',
          status: HttpStatus.SERVICE_UNAVAILABLE,
        });
      }
      throw error;
    }
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

    try {
      // Create the refund
      const refund: Stripe.Refund = await this.circuitBreaker.execute(() => {
        return this.stripeClient.refunds.create(
          {
            payment_intent: payment.stripe_payment_id,
          },
          {
            idempotencyKey: `refund_payment_${paymentId}`,
          },
        );
      });

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
    } catch (error) {
      if (error instanceof BrokenCircuitError) {
        this.logger.error(`[Payment ${paymentId}] Stripe API is failing fast due to Broken Circuit.`);
        throw new AppException({
          code: PaymentErrorCode.PROCESSING_FAILED,
          message: 'Stripe service is temporarily unavailable (Circuit Breaker)',
          status: HttpStatus.SERVICE_UNAVAILABLE,
        });
      }
      throw error;
    }
  }
}
