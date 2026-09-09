import { AmqpConnection, RpcTimeoutError } from '@golevelup/nestjs-rabbitmq';
import { IRpcResponse, SystemErrorCode } from '@libs/contract/base';
import { GatewayTimeoutException, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { MessagePropertyHeaders } from 'amqplib';
import { ClsService } from 'nestjs-cls';

import { RmqExchange } from '../enum/exchange/rmq-exchange.enum';
import { InventoryRoutingKey } from '../enum/routing-key/inventory-routing-key.enum';
import { OrderRoutingKey } from '../enum/routing-key/order-routing-key.enum';
import { PaymentRoutingKey } from '../enum/routing-key/payment-routing-key.enum';
import { ProductBrandRoutingKey } from '../enum/routing-key/product-brand-routing-key.enum';
import { ProductRoutingKey } from '../enum/routing-key/product-routing-key.enum';
import { ShippingRoutingKey } from '../enum/routing-key/shipping-routing-key.enum';
import { UserRoutingKey } from '../enum/routing-key/user-routing-key.enum';

@Injectable()
export class RmqPublisherService {
  private readonly logger = new Logger(RmqPublisherService.name);

  constructor(
    private readonly clsService: ClsService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  /**
   * @description Sends an RPC request over RabbitMQ and awaits the response from the consumer.
   *
   * Automatically attaches `X-Correlation-Id` and `X-User-Id` (if available from CLS context) to the headers and publishes the message to `RmqExchange.ECOMMERCE`.
   *
   * @template T The expected response payload type
   * @param routingKey The target routing key from the allowed `RoutingKey` union type
   * @param payload The request payload to send
   * @returns A promise resolving to the response payload from the consumer
   */
  async request<T>(routingKey: RoutingKey, payload: any): Promise<T> {
    const userId = this.clsService.get<number | undefined>('userId');

    const headers: MessagePropertyHeaders = {
      'X-Correlation-Id': this.clsService.getId(), // must be attach correlationId via headers of RabbitMQ,
      'X-User-Id': userId,
    };

    try {
      const response = await this.amqpConnection.request<IRpcResponse<T>>({
        exchange: RmqExchange.ECOMMERCE,
        routingKey,
        payload,
        headers,
      });

      // If error is thrown, it will be caught by the catch block
      if (!response.success) {
        const { error } = response;
        throw new HttpException(
          error.details ? { message: error.message, details: error.details } : error.message,
          error.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
          { errorCode: error.code },
        );
      }

      // Return the data if success
      return response.data;
    } catch (error) {
      if (error instanceof RpcTimeoutError) {
        this.logger.error(
          `RPC timed out after ${error.timeout}ms (Exchange: ${error.exchange}, RoutingKey: ${error.routingKey})`,
        );
        throw new GatewayTimeoutException(`Service timed out for routing key: ${routingKey}`, {
          errorCode: SystemErrorCode.SERVICE_UNAVAILABLE,
        });
      }

      this.logger.error(`Unknown RPC error: ${error}`);
      throw error;
    }
  }
}

type RoutingKey =
  | InventoryRoutingKey
  | OrderRoutingKey
  | PaymentRoutingKey
  | ProductRoutingKey
  | ProductBrandRoutingKey
  | ShippingRoutingKey
  | UserRoutingKey;
