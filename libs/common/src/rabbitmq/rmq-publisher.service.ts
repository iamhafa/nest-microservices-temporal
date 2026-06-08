import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { Options } from 'amqplib';
import { ClsService } from 'nestjs-cls';
import { RmqExchange } from './enum/rmq-exchange.enum';

@Injectable()
export class RmqPublisherService {
  constructor(
    private readonly clsService: ClsService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  request<T>(routingKey: string, payload: any, publishOptions?: Options.Publish): Promise<T> {
    return this.amqpConnection.request<T>({
      exchange: RmqExchange.ECOMMERCE,
      routingKey,
      payload,
      headers: {
        'X-Correlation-Id': this.clsService.getId(), // must be attach correlationId via headers of RabbitMQ
      },
      publishOptions,
    });
  }
}
