import { ProductCategoryRoutingKey, RmqPublisherService } from '@libs/messaging';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateProductCategoryDto, ProductCategoryResponseDto, UpdateProductCategoryDto } from './dto';

@ApiBearerAuth('Authorization')
@ApiTags('Product Category')
@Controller('product-categories')
export class ProductCategoryController {
  constructor(private readonly rmqPublisher: RmqPublisherService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a product category' })
  @ApiCreatedResponse({ description: 'Product category created successfully', type: ProductCategoryResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  createProductCategory(@Body() createProductCategoryDto: CreateProductCategoryDto): Promise<ProductCategoryResponseDto> {
    return this.rmqPublisher.request<ProductCategoryResponseDto>(ProductCategoryRoutingKey.CREATE, createProductCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all product categories' })
  @ApiOkResponse({ description: 'List of product categories', type: [ProductCategoryResponseDto] })
  getProductCategories(): Promise<ProductCategoryResponseDto[]> {
    return this.rmqPublisher.request<ProductCategoryResponseDto[]>(ProductCategoryRoutingKey.GET_ALL, {});
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product category by ID' })
  @ApiOkResponse({ description: 'Product category details', type: ProductCategoryResponseDto })
  @ApiNotFoundResponse({ description: 'Product category not found' })
  getProductCategory(@Param('id', ParseIntPipe) id: number): Promise<ProductCategoryResponseDto> {
    return this.rmqPublisher.request<ProductCategoryResponseDto>(ProductCategoryRoutingKey.GET_BY_ID, id);
  }

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update a product category' })
  @ApiNoContentResponse({ description: 'Product category updated successfully' })
  @ApiNotFoundResponse({ description: 'Product category not found' })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  updateProductCategory(@Body() updateProductCategoryDto: UpdateProductCategoryDto): Promise<void> {
    return this.rmqPublisher.request<void>(ProductCategoryRoutingKey.UPDATE, updateProductCategoryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product category' })
  @ApiNoContentResponse({ description: 'Product category deleted successfully' })
  @ApiNotFoundResponse({ description: 'Product category not found' })
  deleteProductCategory(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.rmqPublisher.request<void>(ProductCategoryRoutingKey.DELETE, id);
  }
}
