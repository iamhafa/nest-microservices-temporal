import { CreateProductDto, UpdateProductDto } from '@libs/contract/product/dto';
import { Controller } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProductEntity } from './entity/product.entity';
import { CreateProductCommand } from './commands/implements/create-product.command';
import { UpdateProductCommand } from './commands/implements/update-product.command';
import { DeleteProductCommand } from './commands/implements/delete-product.command';
import { GetProductsQuery } from './queries/implements/get-products.query';
import { GetProductQuery } from './queries/implements/get-product.query';

@Controller()
export class ProductController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @MessagePattern({ cmd: 'create-product' })
  createProduct(@Payload() createProductDto: CreateProductDto): Promise<{ message: string; workflowId: string }> {
    return this.commandBus.execute(new CreateProductCommand(createProductDto));
  }

  @MessagePattern({ cmd: 'get-products' })
  getProducts(): Promise<ProductEntity[]> {
    return this.queryBus.execute(new GetProductsQuery());
  }

  @MessagePattern({ cmd: 'get-product' })
  getProduct(@Payload() id: number): Promise<ProductEntity> {
    return this.queryBus.execute(new GetProductQuery(id));
  }

  @MessagePattern({ cmd: 'update-product' })
  updateProduct(@Payload() updateProductDto: UpdateProductDto): Promise<void> {
    return this.commandBus.execute(new UpdateProductCommand(updateProductDto));
  }

  @MessagePattern({ cmd: 'delete-product' })
  deleteProduct(@Payload() id: number): Promise<void> {
    return this.commandBus.execute(new DeleteProductCommand(id));
  }
}
