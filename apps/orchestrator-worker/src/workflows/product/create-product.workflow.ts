import { CreateProductDto } from '@libs/contract/product/dto';
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
  console.log('createProductDto:', createProductDto);
  let productId: number | undefined;

  try {
    const { quantity, ...productDto } = createProductDto;

    // Step 1: Validate Category, Brand, and Tags
    await productActivities.validateProductMetadata(createProductDto);

    // Step 2: Create Product
    productId = await productActivities.createProduct(productDto);

    // Step 3: Initialize Inventory (default quantity 0 if not provided)
    await inventoryActivities.initializeInventory(productId, quantity);

    // Step 4: Generate Product Embedding
    await productActivities.generateProductEmbedding(productId);

    return {
      success: true,
      productId,
    };
  } catch (error) {
    console.error('Error:', error);
    // Compensation
    if (productId) {
      await productActivities.deleteProduct(productId);
    }
    throw error;
  }
}
