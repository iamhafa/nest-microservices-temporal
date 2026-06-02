import { CreateProductDto, UpdateProductDto } from '@libs/contract/product/dto';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { RmqPublisherService } from '@libs/common/rabbitmq';
import {
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

@ApiBearerAuth('Authorization')
@ApiTags('Product')
@Controller('products')
export class ProductController {
  constructor(private readonly rmqPublisher: RmqPublisherService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Create a product' })
  @ApiAcceptedResponse({ description: 'Product creation initiated' })
  @ApiUnprocessableEntityResponse({ description: 'Invalid request' })
  createProduct(@Body() createProductDto: CreateProductDto): Promise<any> {
    return this.rmqPublisher.request('product.create', createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiOkResponse({ description: 'List of products' })
  getProducts(): Promise<any[]> {
    return this.rmqPublisher.request('product.getAll', {});
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiOkResponse({ description: 'Product details' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  getProduct(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return this.rmqPublisher.request('product.get', id);
  }

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update a product' })
  @ApiNoContentResponse({ description: 'Product updated successfully' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiUnprocessableEntityResponse({ description: 'Invalid request' })
  updateProduct(@Body() updateProductDto: UpdateProductDto): Promise<any> {
    return this.rmqPublisher.request('product.update', updateProductDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiNoContentResponse({ description: 'Product deleted successfully' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  deleteProduct(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return this.rmqPublisher.request('product.delete', id);
  }
}
