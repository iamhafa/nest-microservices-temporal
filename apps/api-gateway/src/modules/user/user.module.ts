import { Module } from '@nestjs/common';
import { UserController } from './user.controller.js';

@Module({
  imports: [],
  controllers: [UserController],
})
export class UserModule {}
