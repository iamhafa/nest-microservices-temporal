import { CreateProductDto } from '@libs/contract/product/dto/create-product.dto';
import { UpdateProductDto } from '@libs/contract/product/dto/update-product.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';

@ApiTags('Product')
@Controller('products')
export class ProductController {
  constructor(@Inject('PRODUCT_SERVICE_CLIENT') private readonly productServiceClient: ClientProxy) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Create a product' })
  @ApiAcceptedResponse({ description: 'Product creation initiated' })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  createProduct(@Body() createProductDto: CreateProductDto): Observable<any> {
    return this.productServiceClient.send({ cmd: 'create-product' }, createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiOkResponse({ description: 'List of products' })
  getProducts(): Observable<any[]> {
    return this.productServiceClient.send({ cmd: 'get-products' }, {});
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiOkResponse({ description: 'Product details' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  getProduct(@Param('id', ParseIntPipe) id: number): Observable<any> {
    return this.productServiceClient.send({ cmd: 'get-product' }, id);
  }

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update a product' })
  @ApiNoContentResponse({ description: 'Product updated successfully' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  updateProduct(@Body() updateProductDto: UpdateProductDto): Observable<any> {
    return this.productServiceClient.send({ cmd: 'update-product' }, updateProductDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiNoContentResponse({ description: 'Product deleted successfully' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  deleteProduct(@Param('id', ParseIntPipe) id: number): Observable<any> {
    return this.productServiceClient.send({ cmd: 'delete-product' }, id);
  }
}
