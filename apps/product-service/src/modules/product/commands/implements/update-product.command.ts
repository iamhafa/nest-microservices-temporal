import { UpdateProductDto } from '@libs/contract/product/dto';

export class UpdateProductCommand {
  constructor(public readonly updateProductDto: UpdateProductDto) {}
}
