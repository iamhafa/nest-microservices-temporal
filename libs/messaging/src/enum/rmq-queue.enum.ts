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
