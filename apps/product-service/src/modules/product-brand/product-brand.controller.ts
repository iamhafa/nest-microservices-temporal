import { CreateProductBrandDto } from '@libs/contract/product-brand/dto/create-product-brand.dto';
import { UpdateProductBrandDto } from '@libs/contract/product-brand/dto/update-product-brand.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProductBrandEntity } from './entity/product-brand.entity';
import { ProductBrandService } from './product-brand.service';

@Controller()
export class ProductBrandController {
  constructor(private readonly productBrandService: ProductBrandService) {}

  @MessagePattern({ cmd: 'create-product-brand' })
  createProductBrand(@Payload() createProductBrandDto: CreateProductBrandDto): Promise<ProductBrandEntity> {
    return this.productBrandService.createProductBrand(createProductBrandDto);
  }

  @MessagePattern({ cmd: 'get-product-brands' })
  getProductBrands(): Promise<ProductBrandEntity[]> {
    return this.productBrandService.getProductBrands();
  }

  @MessagePattern({ cmd: 'get-product-brand' })
  getProductBrand(@Payload() id: number): Promise<ProductBrandEntity> {
    return this.productBrandService.getProductBrand(id);
  }

  @MessagePattern({ cmd: 'update-product-brand' })
  updateProductBrand(@Payload() updateProductBrandDto: UpdateProductBrandDto): Promise<void> {
    return this.productBrandService.updateProductBrand(updateProductBrandDto);
  }

  @MessagePattern({ cmd: 'delete-product-brand' })
  deleteProductBrand(@Payload() id: number): Promise<void> {
    return this.productBrandService.deleteProductBrand(id);
  }
}
