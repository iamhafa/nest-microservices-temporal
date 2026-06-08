import { SharedRabbitMQModule } from '@libs/common';
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';

@Module({
  imports: [SharedRabbitMQModule],
  controllers: [UserController],
})
export class UserModule {}
