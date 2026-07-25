import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { AppException } from '@libs/common';
import { InventoryRoutingKey, RmqExchange, RmqQueue } from '@libs/messaging';
import { type IAdjustInventoryDto, InventoryErrorCode } from '@libs/contract/inventory';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
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
    queueOptions: {
      deadLetterExchange: RmqExchange.ECOMMERCE_DLX,
      deadLetterRoutingKey: 'inventory.failed',
    },
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
      throw new AppException({
        code: InventoryErrorCode.ADJUSTMENT_FAILED,
        message: `Cannot adjust stock for product ${product_id}. It may not exist or the adjustment results in negative stock.`,
      });
    } else {
      return this.inventoryRepository.findOneByOrFail({ product_id });
    }
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: InventoryRoutingKey.GET_ALL,
    queue: RmqQueue.INVENTORY_QUEUE,
    queueOptions: {
      deadLetterExchange: RmqExchange.ECOMMERCE_DLX,
      deadLetterRoutingKey: 'inventory.failed',
    },
  })
  getAllInventories(): Promise<InventoryEntity[]> {
    return this.inventoryRepository.find();
  }

  @RabbitRPC({
    exchange: RmqExchange.ECOMMERCE,
    routingKey: InventoryRoutingKey.GET_AVAILABLE_STOCK,
    queue: RmqQueue.INVENTORY_QUEUE,
    queueOptions: {
      deadLetterExchange: RmqExchange.ECOMMERCE_DLX,
      deadLetterRoutingKey: 'inventory.failed',
    },
  })
  async getAvailableStock(@RabbitPayload() productId: number): Promise<{ productId: number; availableQuantity: number }> {
    const inventory = await this.inventoryRepository.findOneBy({ product_id: productId });
    if (!inventory) {
      throw new AppException({
        code: InventoryErrorCode.NOT_FOUND, // Assuming this exists or falls back to generic error
        message: `Inventory for product #${productId} not found`,
        status: HttpStatus.NOT_FOUND,
      });
    }
    return {
      productId,
      availableQuantity: Math.max(0, inventory.stock - inventory.reserved_quantity),
    };
  }
}
