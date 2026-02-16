import { CreateProductRequestDto } from '@libs/contract/product/dto/create-product-request.dto';
import { CreateProductResponseDto } from '@libs/contract/product/dto/create-product-response.dto';
import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
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
  @ApiOperation({ summary: 'Create a product' })
  @ApiCreatedResponse({ type: CreateProductResponseDto, description: 'Product created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  createProduct(@Body() dto: CreateProductRequestDto): Observable<CreateProductResponseDto> {
    return this.productServiceClient.send({ cmd: 'create-product' }, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiOkResponse({ description: 'List of products' })
  getProducts(): Observable<any> {
    return this.productServiceClient.send({ cmd: 'get-products' }, {});
  }
}
