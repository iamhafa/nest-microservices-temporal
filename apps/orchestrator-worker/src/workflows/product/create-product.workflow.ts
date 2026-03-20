import { CreateProductDto } from '@libs/contract/product/dto/create-product.dto';
import { IInventoryActivity, IProductActivity } from '@libs/temporal/activity';
import { WorkFlowTaskQueue } from '@libs/temporal/queue/enum/workflow-task.queue';
import { proxyActivities } from '@temporalio/workflow';

const productActivities = proxyActivities<IProductActivity>({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.PRODUCT,
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 2,
    initialInterval: '1 second',
  },
});

const inventoryActivities = proxyActivities<IInventoryActivity>({
  startToCloseTimeout: '30 seconds',
  taskQueue: WorkFlowTaskQueue.INVENTORY,
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 2,
    initialInterval: '1 second',
  },
});

export async function createProductWorkflow(createProductDto: CreateProductDto) {
  let productId: number | undefined;

  try {
    // Step 1: Create Product
    productId = await productActivities.createProduct(createProductDto);

    // Step 2: Initialize Inventory (default quantity 0 if not provided)
    // Note: You might want to extend the DTO to include initial quantity
    await inventoryActivities.initializeInventory(productId, 0);

    return { success: true, productId };
  } catch (error) {
    // Compensation
    if (productId) {
      await productActivities.deleteProduct(productId);
    }
    throw error;
  }
}
