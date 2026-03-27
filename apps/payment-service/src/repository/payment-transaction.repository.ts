import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { PaymentTransactionEntity } from '../entity/payment-transaction.entity';

@Injectable()
export class PaymentTransactionRepository extends Repository<PaymentTransactionEntity> {
  constructor(protected readonly entityManager: EntityManager) {
    super(PaymentTransactionEntity, entityManager);
  }
}
