import { InjectStripeClient } from '@golevelup/nestjs-stripe';
import { AppException } from '@libs/common';
import { PaymentErrorCode } from '@libs/contract/payment/error/payment-code.error';
import { IRefundPaymentActivity } from '@libs/temporal/activity';
import { HttpStatus, Logger } from '@nestjs/common';
import {
  BrokenCircuitError,
  circuitBreaker,
  CircuitBreakerPolicy,
  ConsecutiveBreaker,
  ExponentialBackoff,
  handleAll,
} from 'cockatiel';
import { isNull, isUndefined } from 'lodash';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';
import { Stripe } from 'stripe';
import { PaymentStatus, PaymentTransactionEntity } from '../entity/payment-transaction.entity';
import { PaymentTransactionRepository } from '../repository/payment-transaction.repository';

@Activity({ name: 'refund-payment' })
export class RefundPaymentActivity implements IRefundPaymentActivity {
  private readonly logger = new Logger(RefundPaymentActivity.name);

  private readonly circuitBreaker: CircuitBreakerPolicy = circuitBreaker(handleAll, {
    halfOpenAfter: new ExponentialBackoff(), // 1s -> 2s -> 4s
    breaker: new ConsecutiveBreaker(5), // 5 lỗi liên tiếp -> OPEN
  });

  constructor(
    @InjectStripeClient() private readonly stripeClient: Stripe,
    private readonly paymentTransactionRepository: PaymentTransactionRepository,
  ) {
    this.circuitBreaker.onBreak(() => this.logger.warn('--- [Stripe] Circuit Breaker OPEN! ---'));
    this.circuitBreaker.onReset(() => this.logger.log('--- [Stripe] Circuit Breaker CLOSED! ---'));
  }

  @ActivityMethod({ name: 'refundPayment' })
  async execute(orderId: number, totalAmount?: number): Promise<void> {
    this.logger.warn(`[Order ${orderId}] Refunding payment...`);

    const existingTransaction = await this.paymentTransactionRepository.findOne({
      where: {
        order_id: orderId,
      },
      select: {
        id: true,
        status: true,
        stripe_payment_id: true,
      },
    });

    if (existingTransaction) {
      if (existingTransaction.status === PaymentStatus.REFUNDED) {
        this.logger.log(`[Order ${orderId}] Payment was already refunded.`);
        return;
      }

      try {
        const refund: Stripe.Refund = await this.circuitBreaker.execute(() => {
          return this.stripeClient.refunds.create(
            {
              payment_intent: existingTransaction.stripe_payment_id,
            },
            {
              idempotencyKey: `refund_order_${orderId}`,
            },
          );
        });

        if (refund.status !== 'succeeded') {
          throw new AppException({
            code: PaymentErrorCode.PROCESSING_FAILED,
            message: `[Order ${orderId}] Refund failed: ${refund.status}`,
          });
        }

        await this.paymentTransactionRepository.update(existingTransaction.id, {
          status: PaymentStatus.REFUNDED,
        });

        this.logger.log(`Refund created: ${refund.id} for order ${orderId}`);
      } catch (error) {
        if (error instanceof BrokenCircuitError) {
          this.logger.error(`[Order ${orderId}] Stripe API is failing fast due to Broken Circuit.`);
          throw new AppException({
            code: PaymentErrorCode.PROCESSING_FAILED,
            message: 'Stripe service is temporarily unavailable (Circuit Breaker)',
            status: HttpStatus.SERVICE_UNAVAILABLE,
          });
        } else {
          this.logger.error(`[Order ${orderId}] Refund failed: ${error}`);
          throw error;
        }
      }
    } else {
      // Transaction record was not found in our DB.
      // If totalAmount is not provided, we cannot attempt to look up/create Stripe intent safely.
      if (isUndefined(totalAmount) || isNull(totalAmount)) {
        this.logger.error(
          `[Order ${orderId}] Transaction not found in DB and totalAmount is not provided. Cannot verify Stripe intent.`,
        );
        throw new AppException({
          code: PaymentErrorCode.PROCESSING_FAILED,
          message: `Transaction not found in DB for order ${orderId} and totalAmount was not provided for lookup.`,
          status: HttpStatus.BAD_REQUEST,
        });
      }

      this.logger.log(`[Order ${orderId}] Transaction not found in DB. Checking Stripe intent via idempotency key...`);

      try {
        // Query Stripe using the same idempotency key to see if charge was created
        const paymentIntent: Stripe.PaymentIntent = await this.circuitBreaker.execute(() => {
          return this.stripeClient.paymentIntents.create(
            {
              amount: totalAmount,
              currency: 'usd',
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
          this.logger.log(
            `[Order ${orderId}] Stripe charge was never successfully created (status: ${paymentIntent.status}). Nothing to refund.`,
          );
          return;
        }

        // Stripe charge succeeded! Now perform the refund.
        const refund: Stripe.Refund = await this.circuitBreaker.execute(() => {
          return this.stripeClient.refunds.create(
            {
              payment_intent: paymentIntent.id,
            },
            {
              idempotencyKey: `refund_order_${orderId}`,
            },
          );
        });

        if (refund.status !== 'succeeded') {
          throw new AppException({
            code: PaymentErrorCode.PROCESSING_FAILED,
            message: `[Order ${orderId}] Stripe refund failed: ${refund.status}`,
          });
        }

        // Save the transaction record as REFUNDED
        const paymentTransaction: PaymentTransactionEntity = this.paymentTransactionRepository.create({
          order_id: orderId,
          stripe_payment_id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: PaymentStatus.REFUNDED,
        });

        const createdPayment = await this.paymentTransactionRepository.save(paymentTransaction);
        this.logger.log(
          `[Order ${orderId}] Refunded dangling stripe charge and saved transaction record id: ${createdPayment.id}`,
        );
      } catch (error) {
        if (error instanceof BrokenCircuitError) {
          throw new AppException({
            code: PaymentErrorCode.PROCESSING_FAILED,
            message: 'Stripe service is temporarily unavailable (Circuit Breaker)',
            status: HttpStatus.SERVICE_UNAVAILABLE,
          });
        } else {
          this.logger.error(`[Order ${orderId}] Refund failed: ${error}`);
          throw error;
        }
      }
    }
  }
}
