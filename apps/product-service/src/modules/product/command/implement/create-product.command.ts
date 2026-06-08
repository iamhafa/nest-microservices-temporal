import { CreateProductDto } from '@libs/contract/product/dto/create-product.dto';

export class CreateProductCommand {
  constructor(public readonly createProductDto: CreateProductDto) {}
}
