import { InjectStripeClient } from '@golevelup/nestjs-stripe';
import { ResiliencePreset } from '@libs/contract/base';
import { PaymentErrorCode } from '@libs/contract/payment';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CircuitOpenError, ResilienceEvent, ResilienceEvents, ResiliencePolicy, ResilienceService } from '@nestjs/resilience';
import { ApplicationFailure } from '@temporalio/common';
import { isDefined, isNumber } from 'class-validator';
import { Stripe } from 'stripe';
import { PaymentStatus, PaymentTransactionEntity } from './entity/payment-transaction.entity.js';
import { PaymentTransactionRepository } from './repository/payment-transaction.repository.js';

@Injectable()
export class PaymentService implements OnModuleInit {
  private readonly logger = new Logger(PaymentService.name);
  private readonly stripePolicy: ResiliencePolicy;

  constructor(
    @InjectStripeClient() private readonly stripeClient: Stripe,
    private readonly resilienceEvents: ResilienceEvents,
    private readonly resilienceService: ResilienceService,
    private readonly paymentTransactionRepository: PaymentTransactionRepository,
  ) {
    this.stripePolicy = this.resilienceService.preset(ResiliencePreset.STRIPE_PAYMENT_GATEWAY);
  }

  onModuleInit(): void {
    this.resilienceEvents.events$.subscribe((event: ResilienceEvent): void => {
      if (event.policy === 'stripe-circuit-breaker' || event.policy === ResiliencePreset.STRIPE_PAYMENT_GATEWAY) {
        if (event.type === 'circuit-open') {
          this.logger.warn(`--- [Stripe] Circuit Breaker OPEN! (state changed from ${event.from} to ${event.to}) ---`);
        } else if (event.type === 'circuit-closed') {
          this.logger.log(`--- [Stripe] Circuit Breaker CLOSED! ---`);
        } else if (event.type === 'circuit-half-open') {
          this.logger.log(`--- [Stripe] Circuit Breaker HALF-OPEN! ---`);
        }
      } else this.logger.debug(event);
    });
  }

  async chargePayment(orderId: number, totalAmount: number): Promise<number> {
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
      const paymentIntent: Stripe.PaymentIntent = await this.stripePolicy.execute(() => {
        return this.stripeClient.paymentIntents.create(
          {
            amount: Math.round(totalAmount * 100), // Stripe expects cents, order total is in dollars
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

        throw new BadRequestException(`[Order ${orderId}] Payment failed: ${paymentIntent.status}`, {
          errorCode: PaymentErrorCode.PROCESSING_FAILED,
        });
      }

      const paymentTransaction: PaymentTransactionEntity = this.paymentTransactionRepository.create({
        order_id: orderId,
        stripe_payment_id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: PaymentStatus.SUCCESS,
      });

      const savedPaymentTransaction: PaymentTransactionEntity = await this.paymentTransactionRepository.save(paymentTransaction);

      this.logger.log(`[Order ${orderId}] Payment successful: ${paymentIntent.id}`);
      return savedPaymentTransaction.id;
    } catch (error) {
      // Circuit breaker is open: the request never reached Stripe.
      // Ask Temporal to retry exactly when the breaker lets a probe call through.
      if (error instanceof CircuitOpenError) {
        this.logger.error(`[Order ${orderId}] Stripe circuit breaker is OPEN. Temporal will retry in ${error.retryAfterMs}ms.`);

        throw ApplicationFailure.create({
          message: `Stripe service is temporarily unavailable (Circuit Breaker). Retry after ${error.retryAfterMs}ms`,
          type: CircuitOpenError.name,
          nextRetryDelay: error.retryAfterMs,
          cause: error,
        });
      }

      // Business errors (card declined, invalid request, payment not succeeded) never fix themselves.
      if (this.isStripeClientError(error) || error instanceof BadRequestException) {
        this.logger.error(`[Order ${orderId}] Payment rejected, will not retry: ${error.message}`);

        throw ApplicationFailure.nonRetryable(
          error.message,
          error instanceof Stripe.errors.StripeError ? error.type : error.name,
        );
      }

      // Transient errors (Stripe 5xx, network, DB): let Temporal retry with its backoff.
      this.logger.error(
        `[Order ${orderId}] Failed to charge payment: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      throw error;
    }
  }

  /** Stripe 4xx except 408 (timeout) and 429 (rate limit), which are worth retrying. */
  private isStripeClientError(error: unknown): error is Stripe.errors.StripeError {
    if (!(error instanceof Stripe.errors.StripeError) || !isNumber(error.statusCode)) {
      return false;
    }
    const { statusCode } = error;

    return (
      statusCode >= HttpStatus.BAD_REQUEST &&
      statusCode < HttpStatus.INTERNAL_SERVER_ERROR &&
      statusCode !== HttpStatus.REQUEST_TIMEOUT &&
      statusCode !== HttpStatus.TOO_MANY_REQUESTS
    );
  }

  async refundPayment(orderId: number, totalAmount?: number): Promise<void> {
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
        const refund: Stripe.Refund = await this.stripePolicy.execute(() => {
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
          this.logger.warn(
            `[Order ${orderId}] Refund ${refund.id} for payment intent ${existingTransaction.stripe_payment_id} not succeeded (status: ${refund.status}).`,
          );
          throw new InternalServerErrorException(`[Order ${orderId}] Refund failed: ${refund.status}`, {
            errorCode: PaymentErrorCode.PROCESSING_FAILED,
          });
        }

        await this.paymentTransactionRepository.update(existingTransaction.id, {
          status: PaymentStatus.REFUNDED,
        });

        this.logger.log(`Refund created: ${refund.id} for order ${orderId}`);
      } catch (error) {
        if (error instanceof CircuitOpenError) {
          this.logger.error(`[Order ${orderId}] Stripe API is failing fast due to Circuit Breaker (Open).`);
          throw new ServiceUnavailableException('Stripe service is temporarily unavailable (Circuit Breaker)', {
            errorCode: PaymentErrorCode.PROCESSING_FAILED,
          });
        }

        this.logger.error(`[Order ${orderId}] Refund failed: ${error}`);
        throw error;
      }
    } else {
      if (!isDefined(totalAmount)) {
        this.logger.error(
          `[Order ${orderId}] Transaction not found in DB and totalAmount is not provided. Cannot verify Stripe intent.`,
        );
        throw new BadRequestException(
          `Transaction not found in DB for order ${orderId} and totalAmount was not provided for lookup.`,
          {
            errorCode: PaymentErrorCode.PROCESSING_FAILED,
          },
        );
      }

      this.logger.log(`[Order ${orderId}] Transaction not found in DB. Checking Stripe intent via idempotency key...`);

      try {
        const paymentIntent: Stripe.PaymentIntent = await this.stripePolicy.execute(() => {
          return this.stripeClient.paymentIntents.create(
            {
              amount: Math.round(totalAmount * 100), // Stripe expects cents, order total is in dollars
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

        const refund: Stripe.Refund = await this.stripePolicy.execute(() => {
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
          this.logger.warn(
            `[Order ${orderId}] Refund ${refund.id} for dangling payment intent ${paymentIntent.id} not succeeded (status: ${refund.status}).`,
          );
          throw new InternalServerErrorException(`[Order ${orderId}] Stripe refund failed: ${refund.status}`, {
            errorCode: PaymentErrorCode.PROCESSING_FAILED,
          });
        }

        const paymentTransaction: PaymentTransactionEntity = this.paymentTransactionRepository.create({
          order_id: orderId,
          stripe_payment_id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: PaymentStatus.REFUNDED,
        });

        const createdPayment: PaymentTransactionEntity = await this.paymentTransactionRepository.save(paymentTransaction);
        this.logger.log(
          `[Order ${orderId}] Refunded dangling stripe charge and saved transaction record id: ${createdPayment.id}`,
        );
      } catch (error) {
        if (error instanceof CircuitOpenError) {
          this.logger.error(`[Order ${orderId}] Stripe API is failing fast due to Circuit Breaker (Open).`);
          throw new ServiceUnavailableException('Stripe service is temporarily unavailable (Circuit Breaker)', {
            errorCode: PaymentErrorCode.PROCESSING_FAILED,
          });
        }

        this.logger.error(`[Order ${orderId}] Refund failed: ${error}`);
        throw error;
      }
    }
  }
}
