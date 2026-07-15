import { SystemErrorCode } from '@libs/contract/base';
import { InventoryErrorCode } from '@libs/contract/inventory';
import { OrderErrorCode } from '@libs/contract/order';
import { PaymentErrorCode } from '@libs/contract/payment';
import { ProductErrorCode } from '@libs/contract/product';
import { ShippingErrorCode } from '@libs/contract/shipping';
import { UserErrorCode } from '@libs/contract/user';
import { HttpException, HttpStatus } from '@nestjs/common';

interface ExceptionDetails {
  field: string;
  message: string;
}

type AppErrorCode =
  | SystemErrorCode
  | InventoryErrorCode
  | OrderErrorCode
  | ProductErrorCode
  | UserErrorCode
  | PaymentErrorCode
  | ShippingErrorCode;

export interface AppExceptionOptions {
  code: AppErrorCode;
  message: string;
  status?: HttpStatus;
  details?: ExceptionDetails[]; // only for validation failed error
}

export class AppException extends HttpException {
  readonly code: AppErrorCode;
  readonly details?: ExceptionDetails[];

  constructor(options: AppExceptionOptions) {
    const status = options.status || HttpStatus.BAD_REQUEST;
    super(options.message, status);
    this.code = options.code;
    this.details = options.details;
  }
}
