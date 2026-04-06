import { Controller } from '@nestjs/common';
import { ProductBrandService } from './product-brand.service';

@Controller()
export class ProductBrandController {
  constructor(private readonly productBrandService: ProductBrandService) {}
}
