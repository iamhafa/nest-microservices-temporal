import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { ProductTagRoutingKey, RmqExchange, RmqQueue } from '@libs/messaging';
import { type ICreateProductTagDto, type IUpdateProductTagDto, ProductErrorCode } from '@libs/contract/product';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductTagEntity } from './entity/product-tag.entity';
import { ProductTagRepository } from './repository/product-tag.repository';

@Injectable()
export class ProductTagService {
  constructor(private readonly productTagRepository: ProductTagRepository) {}

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: ProductTagRoutingKey.CREATE,
    queue: RmqQueue.PRODUCT_QUEUE,
  })
  async createProductTag(@RabbitPayload() dto: ICreateProductTagDto): Promise<ProductTagEntity> {
    const tag = this.productTagRepository.create(dto);
    return this.productTagRepository.save(tag);
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: ProductTagRoutingKey.GET_ALL,
    queue: RmqQueue.PRODUCT_QUEUE,
  })
  getProductTags(): Promise<ProductTagEntity[]> {
    return this.productTagRepository.find();
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: ProductTagRoutingKey.GET_BY_ID,
    queue: RmqQueue.PRODUCT_QUEUE,
  })
  async getProductTag(@RabbitPayload() id: number): Promise<ProductTagEntity> {
    const tag = await this.productTagRepository.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException(`Product tag #${id} not found`, {
        errorCode: ProductErrorCode.TAG_NOT_FOUND,
      });
    }
    return tag;
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: ProductTagRoutingKey.UPDATE,
    queue: RmqQueue.PRODUCT_QUEUE,
  })
  async updateProductTag(@RabbitPayload() dto: IUpdateProductTagDto): Promise<void> {
    const { id, ...updateData } = dto;
    const result = await this.productTagRepository.update(id, updateData);
    if (result.affected === 0) {
      throw new NotFoundException(`Product tag #${id} not found`, {
        errorCode: ProductErrorCode.TAG_NOT_FOUND,
      });
    }
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: ProductTagRoutingKey.DELETE,
    queue: RmqQueue.PRODUCT_QUEUE,
  })
  async deleteProductTag(@RabbitPayload() id: number): Promise<void> {
    const tag = await this.getProductTag(id);
    await this.productTagRepository.softDelete(tag.id);
  }
}
