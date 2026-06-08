export enum RmqExchange {
  ECOMMERCE = 'ecommerce.exchange',
  ECOMMERCE_DLX = 'ecommerce.dlx.exchange',
}

export enum RmqRoutingKey {
  ORDER_CREATE = 'order.create',
  ORDER_CREATED = 'order.created',
  ORDER_CANCEL = 'order.cancel',
  ORDER_CANCELLED = 'order.cancelled',
  ORDER_DELIVER = 'order.deliver',

  INVENTORY_RESERVE = 'inventory.reserve',
  INVENTORY_CONFIRM = 'inventory.confirm',
  INVENTORY_RESTORE = 'inventory.restore',

  PAYMENT_CHARGE = 'payment.charge',
  PAYMENT_REFUND = 'payment.refund',
}

export enum RmqQueue {
  ORDER_QUEUE = 'order.queue',
  INVENTORY_QUEUE = 'inventory.queue',
  PAYMENT_QUEUE = 'payment.queue',
  SHIPPING_QUEUE = 'shipping.queue',
  PRODUCT_QUEUE = 'product.queue',
  RECOMMENDATION_QUEUE = 'recommendation.queue',
  USER_QUEUE = 'user.queue',
}
