import { IUpdateProductDto } from '@libs/contract/product';

export class UpdateProductCommand {
  constructor(public readonly updateProductDto: IUpdateProductDto) {}
}
