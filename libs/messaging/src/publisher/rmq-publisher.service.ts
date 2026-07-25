import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
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
  request<T>(routingKey: RoutingKey, payload: any): Promise<T> {
    const userId = this.clsService.get<number | undefined>('userId');

    const headers: MessagePropertyHeaders = {
      'X-Correlation-Id': this.clsService.getId(), // must be attach correlationId via headers of RabbitMQ,
    };

    if (userId) {
      headers['X-User-Id'] = userId;
    }

    return this.amqpConnection.request<T>({
      exchange: RmqExchange.ECOMMERCE,
      routingKey,
      payload,
      headers,
    });
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
