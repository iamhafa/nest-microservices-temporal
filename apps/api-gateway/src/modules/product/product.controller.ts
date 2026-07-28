import { ProductRoutingKey, RmqPublisherService } from '@libs/messaging';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
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
import { CreateProductDto, ProductResponseDto, UpdateProductDto } from './dto';
import { WorkflowInitiatedResponseDto } from '../order/dto';

@ApiBearerAuth('Authorization')
@ApiTags('Product')
@Controller('products')
export class ProductController {
  constructor(private readonly rmqPublisher: RmqPublisherService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: '⚡ [Workflow Async] Create a product' })
  @ApiAcceptedResponse({ description: 'Product creation initiated', type: WorkflowInitiatedResponseDto })
  @ApiUnprocessableEntityResponse({ description: 'Invalid request' })
  createProduct(@Body() createProductDto: CreateProductDto): Promise<WorkflowInitiatedResponseDto> {
    return this.rmqPublisher.request<WorkflowInitiatedResponseDto>(ProductRoutingKey.CREATE, createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiOkResponse({ description: 'List of products', type: [ProductResponseDto] })
  getProducts(): Promise<ProductResponseDto[]> {
    return this.rmqPublisher.request<ProductResponseDto[]>(ProductRoutingKey.GET_ALL, {});
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiOkResponse({ description: 'Product details', type: ProductResponseDto })
  @ApiNotFoundResponse({ description: 'Product not found' })
  getProduct(@Param('id', ParseIntPipe) id: number): Promise<ProductResponseDto> {
    return this.rmqPublisher.request<ProductResponseDto>(ProductRoutingKey.GET_BY_ID, id);
  }

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update a product' })
  @ApiNoContentResponse({ description: 'Product updated successfully' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiUnprocessableEntityResponse({ description: 'Invalid request' })
  updateProduct(@Body() updateProductDto: UpdateProductDto): Promise<void> {
    return this.rmqPublisher.request<void>(ProductRoutingKey.UPDATE, updateProductDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiNoContentResponse({ description: 'Product deleted successfully' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  deleteProduct(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.rmqPublisher.request<void>(ProductRoutingKey.DELETE, id);
  }
}
