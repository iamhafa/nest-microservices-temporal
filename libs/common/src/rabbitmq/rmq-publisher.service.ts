import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { RmqExchange } from '@libs/contract/rabbitmq/constants';
import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class RmqPublisherService {
  constructor(
    private readonly clsService: ClsService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  request<T>(routingKey: string, payload: any): Promise<T> {
    return this.amqpConnection.request<T>({
      exchange: RmqExchange.ECOMMERCE,
      routingKey,
      payload,
      headers: {
        'X-Correlation-Id': this.clsService.getId(), // must be attach correlationId via headers of RabbitMQ
      },
    });
  }
}
