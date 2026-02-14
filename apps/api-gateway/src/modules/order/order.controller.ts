import { CreateOrderDto } from '@contract/order/dto/create-order.dto';
import { HttpService } from '@nestjs/axios';
import { Body, Controller, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';

@ApiTags('Order')
@Controller('orders')
export class OrderController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Place an order' })
  @ApiResponse({ status: 201, description: 'Order placed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.configService.get<string>('ORDER_SERVICE_URL')}/orders`, createOrderDto, {}),
    );

    return response.data;
  }
}
