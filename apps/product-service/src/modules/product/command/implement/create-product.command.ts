import { ICreateProductDto } from '@libs/contract/product';

export class CreateProductCommand {
  constructor(public readonly createProductDto: ICreateProductDto) {}
}
