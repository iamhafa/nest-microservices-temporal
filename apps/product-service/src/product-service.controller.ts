import { CreateProductRequestDto } from '@libs/contract/product/dto/create-product-request.dto';
import { CreateProductResponseDto } from '@libs/contract/product/dto/create-product-response.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProductEntity } from './entity/product.entity';
import { ProductService } from './product-service.service';

@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @MessagePattern({ cmd: 'create-product' })
  createProduct(@Payload() dto: CreateProductRequestDto): Promise<CreateProductResponseDto> {
    return this.productService.createProduct(dto);
  }

  @MessagePattern({ cmd: 'get-products' })
  getProducts(): Promise<ProductEntity[]> {
    return this.productService.getProducts();
  }
}
