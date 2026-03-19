import { CreateProductRequestDto } from '@libs/contract/product/dto/create-product-request.dto';
import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';

@ApiTags('Product')
@Controller('products')
export class ProductController {
  constructor(
    @Inject('PRODUCT_SERVICE_CLIENT')
    private readonly productServiceClient: ClientProxy,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Create a product' })
  @ApiCreatedResponse({ description: 'Product created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  createProduct(@Body() dto: CreateProductRequestDto): Observable<any> {
    return this.productServiceClient.send({ cmd: 'create-product' }, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiOkResponse({ description: 'List of products' })
  getProducts(): Observable<any> {
    return this.productServiceClient.send({ cmd: 'get-products' }, {});
  }
}
