import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { RmqExchange, RmqQueue } from '@libs/common';
import { CreateProductDto } from '@libs/contract/product/dto/create-product.dto';
import { UpdateProductDto } from '@libs/contract/product/dto/update-product.dto';
import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateProductCommand } from './command/implement/create-product.command';
import { DeleteProductCommand } from './command/implement/delete-product.command';
import { UpdateProductCommand } from './command/implement/update-product.command';
import { ProductEntity } from './entity/product.entity';
import { GetProductQuery } from './query/implement/get-product.query';
import { GetProductsQuery } from './query/implement/get-products.query';

@Injectable()
export class ProductService {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: 'product.create',
    queue: RmqQueue.PRODUCT_QUEUE,
  })
  createProduct(@RabbitPayload() createProductDto: CreateProductDto): Promise<{ message: string; workflowId: string }> {
    return this.commandBus.execute(new CreateProductCommand(createProductDto));
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: 'product.getAll',
    queue: RmqQueue.PRODUCT_QUEUE,
  })
  getProducts(): Promise<ProductEntity[]> {
    return this.queryBus.execute(new GetProductsQuery());
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: 'product.get',
    queue: RmqQueue.PRODUCT_QUEUE,
  })
  getProduct(@RabbitPayload() id: number): Promise<ProductEntity> {
    return this.queryBus.execute(new GetProductQuery(id));
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: 'product.update',
    queue: RmqQueue.PRODUCT_QUEUE,
  })
  updateProduct(@RabbitPayload() updateProductDto: UpdateProductDto): Promise<void> {
    return this.commandBus.execute(new UpdateProductCommand(updateProductDto));
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: 'product.delete',
    queue: RmqQueue.PRODUCT_QUEUE,
  })
  deleteProduct(@RabbitPayload() id: number): Promise<void> {
    return this.commandBus.execute(new DeleteProductCommand(id));
  }
}
