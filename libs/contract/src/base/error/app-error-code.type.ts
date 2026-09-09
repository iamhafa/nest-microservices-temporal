import { InventoryErrorCode } from '../../inventory';
import { OrderErrorCode } from '../../order';
import { PaymentErrorCode } from '../../payment';
import { ProductErrorCode } from '../../product';
import { ShippingErrorCode } from '../../shipping';
import { UserErrorCode } from '../../user';
import { SystemErrorCode } from './system-error-codes';

export type AppErrorCode =
  | SystemErrorCode
  | InventoryErrorCode
  | OrderErrorCode
  | ProductErrorCode
  | UserErrorCode
  | PaymentErrorCode
  | ShippingErrorCode;
