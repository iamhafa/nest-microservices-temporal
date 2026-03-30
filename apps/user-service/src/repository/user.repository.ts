import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { UserEntity } from '../entity/user.entity';

@Injectable()
export class UserRepository extends Repository<UserEntity> {
  constructor(protected readonly entityManager: EntityManager) {
    super(UserEntity, entityManager);
  }
}
