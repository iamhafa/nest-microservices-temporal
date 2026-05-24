import { InjectStripeClient } from '@golevelup/nestjs-stripe';
import { AppException } from '@libs/common/exception/app-exception';
import { PaymentErrorCode } from '@libs/contract/payment/error';
import { IRefundPayment } from '@libs/temporal/activity';
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
import { PaymentStatus } from '../entity/payment-transaction.entity';
import { PaymentTransactionRepository } from '../repository/payment-transaction.repository';

@Activity({ name: 'refund-payment' })
export class RefundPaymentActivity implements IRefundPayment {
  private readonly logger = new Logger(RefundPaymentActivity.name);

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

  @ActivityMethod({ name: 'refundPayment' })
  async execute(paymentId: number): Promise<void> {
    this.logger.warn(`[Payment ${paymentId}] Refunding payment...`);

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

    const payment = await this.paymentTransactionRepository.findOneOrFail({
      where: {
        id: paymentId,
      },
      select: {
        stripe_payment_id: true,
      },
    });

    try {
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
