import { InjectStripeClient } from '@golevelup/nestjs-stripe';
import { AppException } from '@libs/common';
import { PaymentErrorCode } from '@libs/contract/payment/error/payment-code.error';
import { IChargePaymentActivity } from '@libs/temporal';
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

@Activity({ name: 'charge-payment-activity' })
export class ChargePaymentActivity implements IChargePaymentActivity {
  private readonly logger = new Logger(ChargePaymentActivity.name);

  private readonly circuitBreaker: CircuitBreakerPolicy = circuitBreaker(handleAll, {
    halfOpenAfter: new ExponentialBackoff(),
    breaker: new ConsecutiveBreaker(5),
  });

  constructor(
    @InjectStripeClient() private readonly stripeClient: Stripe,
    private readonly paymentTransactionRepository: PaymentTransactionRepository,
  ) {
    this.circuitBreaker.onBreak(() => this.logger.warn('--- [Stripe] Circuit Breaker OPEN! ---'));
    this.circuitBreaker.onReset(() => this.logger.log('--- [Stripe] Circuit Breaker CLOSED! ---'));
  }

  @ActivityMethod({ name: 'chargePayment' })
  async execute(orderId: number, totalAmount: number): Promise<number> {
    this.logger.log(`[Order ${orderId}] Charging payment: ${totalAmount} USD`);

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
        this.logger.error(`[Order ${orderId}] Payment failed: ${paymentIntent.status}`);

        throw new AppException({
          code: PaymentErrorCode.PROCESSING_FAILED,
          status: HttpStatus.BAD_REQUEST,
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

      this.logger.error(
        `[Order ${orderId}] Failed to charge payment: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      throw error;
    }
  }
}
