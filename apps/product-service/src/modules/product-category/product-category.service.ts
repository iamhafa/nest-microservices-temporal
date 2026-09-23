import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { ProductCategoryRoutingKey, RmqExchange, RmqQueue } from '@libs/messaging';
import { type ICreateProductCategoryDto, type IUpdateProductCategoryDto, ProductErrorCode } from '@libs/contract/product';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductCategoryEntity } from './entity/product-category.entity';
import { ProductCategoryRepository } from './repository/product-category.repository';

@Injectable()
export class ProductCategoryService {
  constructor(private readonly productCategoryRepository: ProductCategoryRepository) {}

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: ProductCategoryRoutingKey.CREATE,
    queue: RmqQueue.PRODUCT_QUEUE,
  })
  async createProductCategory(@RabbitPayload() dto: ICreateProductCategoryDto): Promise<ProductCategoryEntity> {
    const category = this.productCategoryRepository.create(dto);
    return this.productCategoryRepository.save(category);
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: ProductCategoryRoutingKey.GET_ALL,
    queue: RmqQueue.PRODUCT_QUEUE,
  })
  getProductCategories(): Promise<ProductCategoryEntity[]> {
    return this.productCategoryRepository.find();
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: ProductCategoryRoutingKey.GET_BY_ID,
    queue: RmqQueue.PRODUCT_QUEUE,
  })
  async getProductCategory(@RabbitPayload() id: number): Promise<ProductCategoryEntity> {
    const category = await this.productCategoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Product category #${id} not found`, {
        errorCode: ProductErrorCode.CATEGORY_NOT_FOUND,
      });
    }
    return category;
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: ProductCategoryRoutingKey.UPDATE,
    queue: RmqQueue.PRODUCT_QUEUE,
  })
  async updateProductCategory(@RabbitPayload() dto: IUpdateProductCategoryDto): Promise<void> {
    const { id, ...updateData } = dto;
    const result = await this.productCategoryRepository.update(id, updateData);
    if (result.affected === 0) {
      throw new NotFoundException(`Product category #${id} not found`, {
        errorCode: ProductErrorCode.CATEGORY_NOT_FOUND,
      });
    }
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: ProductCategoryRoutingKey.DELETE,
    queue: RmqQueue.PRODUCT_QUEUE,
  })
  async deleteProductCategory(@RabbitPayload() id: number): Promise<void> {
    const category = await this.getProductCategory(id);
    await this.productCategoryRepository.softDelete(category.id);
  }
}
