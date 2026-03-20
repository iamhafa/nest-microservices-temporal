import { CreateProductDto } from '@libs/contract/product/dto/create-product.dto';
import { UpdateProductDto } from '@libs/contract/product/dto/update-product.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProductEntity } from './entity/product.entity';
import { ProductService } from './product-service.service';

@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @MessagePattern({ cmd: 'create-product' })
  createProduct(@Payload() createProductDto: CreateProductDto): Promise<ProductEntity> {
    return this.productService.createProduct(createProductDto);
  }

  @MessagePattern({ cmd: 'get-products' })
  getProducts(): Promise<ProductEntity[]> {
    return this.productService.getProducts();
  }

  @MessagePattern({ cmd: 'get-product' })
  getProduct(@Payload() id: number): Promise<ProductEntity> {
    return this.productService.getProduct(id);
  }

  @MessagePattern({ cmd: 'update-product' })
  updateProduct(@Payload() updateProductDto: UpdateProductDto): Promise<ProductEntity> {
    return this.productService.updateProduct(updateProductDto);
  }

  @MessagePattern({ cmd: 'delete-product' })
  deleteProduct(@Payload() id: number): Promise<void> {
    return this.productService.deleteProduct(id);
  }
}
