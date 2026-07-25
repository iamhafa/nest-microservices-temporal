import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { AppException } from '@libs/common';
import { ProductBrandRoutingKey, RmqExchange, RmqQueue } from '@libs/messaging';
import { type ICreateProductBrandDto, type IUpdateProductBrandDto, ProductErrorCode } from '@libs/contract/product';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ProductBrandEntity } from './entity/product-brand.entity';
import { ProductBrandRepository } from './repository/product-brand.repository';

@Injectable()
export class ProductBrandService {
  constructor(private readonly productBrandRepository: ProductBrandRepository) {}

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: ProductBrandRoutingKey.CREATE,
    queue: RmqQueue.PRODUCT_QUEUE,
  })
  async createProductBrand(@RabbitPayload() dto: ICreateProductBrandDto): Promise<ProductBrandEntity> {
    const brand = this.productBrandRepository.create(dto);
    return this.productBrandRepository.save(brand);
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: ProductBrandRoutingKey.GET_ALL,
    queue: RmqQueue.PRODUCT_QUEUE,
  })
  getProductBrands(): Promise<ProductBrandEntity[]> {
    return this.productBrandRepository.find();
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: ProductBrandRoutingKey.GET_BY_ID,
    queue: RmqQueue.PRODUCT_QUEUE,
  })
  async getProductBrand(@RabbitPayload() id: number): Promise<ProductBrandEntity> {
    const brand = await this.productBrandRepository.findOne({ where: { id } });
    if (!brand) {
      throw new AppException({
        code: ProductErrorCode.BRAND_NOT_FOUND,
        message: `Product brand #${id} not found`,
        status: HttpStatus.NOT_FOUND,
      });
    }
    return brand;
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: ProductBrandRoutingKey.UPDATE,
    queue: RmqQueue.PRODUCT_QUEUE,
  })
  async updateProductBrand(@RabbitPayload() dto: IUpdateProductBrandDto): Promise<void> {
    const { id, ...updateData } = dto;
    const result = await this.productBrandRepository.update(id, updateData);
    if (result.affected === 0) {
      throw new AppException({
        code: ProductErrorCode.BRAND_NOT_FOUND,
        message: `Product brand #${id} not found`,
        status: HttpStatus.NOT_FOUND,
      });
    }
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: ProductBrandRoutingKey.DELETE,
    queue: RmqQueue.PRODUCT_QUEUE,
  })
  async deleteProductBrand(@RabbitPayload() id: number): Promise<void> {
    const brand = await this.getProductBrand(id);
    await this.productBrandRepository.softDelete(brand.id);
  }
}
