import { InventoryErrorCode } from '../../inventory/index.js';
import { OrderErrorCode } from '../../order/index.js';
import { PaymentErrorCode } from '../../payment/index.js';
import { ProductErrorCode } from '../../product/index.js';
import { ShippingErrorCode } from '../../shipping/index.js';
import { UserErrorCode } from '../../user/index.js';
import { SystemErrorCode } from './system-error-codes.js';

export type AppErrorCode =
  | SystemErrorCode
  | InventoryErrorCode
  | OrderErrorCode
  | ProductErrorCode
  | UserErrorCode
  | PaymentErrorCode
  | ShippingErrorCode;
