import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { ProductRepository } from '../../repository/product.repository';
import { DeleteProductCommand } from '../implements/delete-product.command';
import { GetProductQuery } from '../../queries/implements/get-product.query';

@CommandHandler(DeleteProductCommand)
export class DeleteProductHandler implements ICommandHandler<DeleteProductCommand> {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(command: DeleteProductCommand): Promise<void> {
    const { id } = command;

    const product = await this.queryBus.execute(new GetProductQuery(id));

    await this.productRepository.softDelete(product.id);
  }
}
