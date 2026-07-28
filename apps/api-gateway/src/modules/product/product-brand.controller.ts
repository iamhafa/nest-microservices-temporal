import { ProductBrandRoutingKey, RmqPublisherService } from '@libs/messaging';
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
import { CreateProductBrandDto, ProductBrandResponseDto, UpdateProductBrandDto } from './dto';

@ApiBearerAuth('Authorization')
@ApiTags('Product Brand')
@Controller('product-brands')
export class ProductBrandController {
  constructor(private readonly rmqPublisher: RmqPublisherService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a product brand' })
  @ApiCreatedResponse({ description: 'Product brand created successfully', type: ProductBrandResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  createProductBrand(@Body() createProductBrandDto: CreateProductBrandDto): Promise<ProductBrandResponseDto> {
    return this.rmqPublisher.request<ProductBrandResponseDto>(ProductBrandRoutingKey.CREATE, createProductBrandDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all product brands' })
  @ApiOkResponse({ description: 'List of product brands', type: [ProductBrandResponseDto] })
  getProductBrands(): Promise<ProductBrandResponseDto[]> {
    return this.rmqPublisher.request<ProductBrandResponseDto[]>(ProductBrandRoutingKey.GET_ALL, {});
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product brand by ID' })
  @ApiOkResponse({ description: 'Product brand details', type: ProductBrandResponseDto })
  @ApiNotFoundResponse({ description: 'Product brand not found' })
  getProductBrand(@Param('id', ParseIntPipe) id: number): Promise<ProductBrandResponseDto> {
    return this.rmqPublisher.request<ProductBrandResponseDto>(ProductBrandRoutingKey.GET_BY_ID, id);
  }

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update a product brand' })
  @ApiNoContentResponse({ description: 'Product brand updated successfully' })
  @ApiNotFoundResponse({ description: 'Product brand not found' })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  updateProductBrand(@Body() updateProductBrandDto: UpdateProductBrandDto): Promise<void> {
    return this.rmqPublisher.request<void>(ProductBrandRoutingKey.UPDATE, updateProductBrandDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product brand' })
  @ApiNoContentResponse({ description: 'Product brand deleted successfully' })
  @ApiNotFoundResponse({ description: 'Product brand not found' })
  deleteProductBrand(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.rmqPublisher.request<void>(ProductBrandRoutingKey.DELETE, id);
  }
}
