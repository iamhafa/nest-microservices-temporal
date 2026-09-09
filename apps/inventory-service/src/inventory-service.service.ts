import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { type IAdjustInventoryDto, InventoryErrorCode } from '@libs/contract/inventory';
import { InventoryRoutingKey, RmqExchange, RmqQueue } from '@libs/messaging';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UpdateResult } from 'typeorm';
import { InventoryEntity } from './entity/inventory.entity';
import { InventoryRepository } from './repository/inventory.repository';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly inventoryRepository: InventoryRepository) {}

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: InventoryRoutingKey.ADJUST,
    queue: RmqQueue.INVENTORY_QUEUE,
  })
  async adjustInventory(@RabbitPayload() adjustInventoryDto: IAdjustInventoryDto): Promise<InventoryEntity> {
    this.logger.log(`Adjusting inventory for product ${adjustInventoryDto.product_id}`);
    const { product_id, quantity_change } = adjustInventoryDto;

    const result: UpdateResult = await this.inventoryRepository
      .createQueryBuilder()
      .update(InventoryEntity)
      .set({
        stock: () => `stock + :quantityChange`,
      })
      .setParameter('quantityChange', quantity_change)
      .where('product_id = :productId', { productId: product_id })
      .andWhere('stock + :quantityChange >= 0', { quantityChange: quantity_change })
      .execute();

    if (result.affected === 0) {
      throw new BadRequestException(
        `Cannot adjust stock for product ${product_id}. It may not exist or the adjustment results in negative stock.`,
        {
          errorCode: InventoryErrorCode.ADJUSTMENT_FAILED,
        },
      );
    } else {
      return this.inventoryRepository.findOneByOrFail({ product_id });
    }
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: InventoryRoutingKey.GET_ALL,
    queue: RmqQueue.INVENTORY_QUEUE,
  })
  getAllInventories(): Promise<InventoryEntity[]> {
    return this.inventoryRepository.find();
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: InventoryRoutingKey.GET_AVAILABLE_STOCK,
    queue: RmqQueue.INVENTORY_QUEUE,
  })
  async getAvailableStock(@RabbitPayload() productId: number): Promise<{ productId: number; availableQuantity: number }> {
    const inventory = await this.inventoryRepository.findOneBy({ product_id: productId });
    if (!inventory) {
      throw new NotFoundException(`Inventory for product #${productId} not found`, {
        errorCode: InventoryErrorCode.NOT_FOUND,
      });
    }
    return {
      productId,
      availableQuantity: Math.max(0, inventory.stock - inventory.reserved_quantity),
    };
  }
}
