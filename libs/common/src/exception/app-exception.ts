import { HttpException, HttpStatus } from '@nestjs/common';

interface ExceptionDetails {
  field: string;
  message: string;
}

export interface AppExceptionOptions {
  code: string;
  message: string;
  status?: HttpStatus;
  details?: ExceptionDetails[]; // only for validation failed error
}

export class AppException extends HttpException {
  readonly code: string;
  readonly details?: ExceptionDetails[];

  constructor(options: AppExceptionOptions) {
    const status = options.status || HttpStatus.BAD_REQUEST;
    super(options.message, status);
    this.code = options.code;
    this.details = options.details;
  }
}
