export enum OrderRoutingKey {
  CREATE = 'order.create',
  CREATED = 'order.created',
  CANCEL = 'order.cancel',
  CANCELLED = 'order.cancelled',
  DELIVER = 'order.deliver',
  GET_BY_ID = 'order.get-by-id',
  GET_ALL = 'order.get-all',
  GET_MY_ORDERS = 'order.get-my-orders',
  UPDATE_STATUS = 'order.update-status',
}
