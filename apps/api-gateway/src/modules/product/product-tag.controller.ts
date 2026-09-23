import { ProductTagRoutingKey, RmqPublisherService } from '@libs/messaging';
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
import { CreateProductTagDto, ProductTagResponseDto, UpdateProductTagDto } from './dto';

@ApiBearerAuth('Authorization')
@ApiTags('Product Tag')
@Controller('product-tags')
export class ProductTagController {
  constructor(private readonly rmqPublisher: RmqPublisherService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a product tag' })
  @ApiCreatedResponse({ description: 'Product tag created successfully', type: ProductTagResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  createProductTag(@Body() createProductTagDto: CreateProductTagDto): Promise<ProductTagResponseDto> {
    return this.rmqPublisher.request<ProductTagResponseDto>(ProductTagRoutingKey.CREATE, createProductTagDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all product tags' })
  @ApiOkResponse({ description: 'List of product tags', type: [ProductTagResponseDto] })
  getProductTags(): Promise<ProductTagResponseDto[]> {
    return this.rmqPublisher.request<ProductTagResponseDto[]>(ProductTagRoutingKey.GET_ALL, {});
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product tag by ID' })
  @ApiOkResponse({ description: 'Product tag details', type: ProductTagResponseDto })
  @ApiNotFoundResponse({ description: 'Product tag not found' })
  getProductTag(@Param('id', ParseIntPipe) id: number): Promise<ProductTagResponseDto> {
    return this.rmqPublisher.request<ProductTagResponseDto>(ProductTagRoutingKey.GET_BY_ID, id);
  }

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update a product tag' })
  @ApiNoContentResponse({ description: 'Product tag updated successfully' })
  @ApiNotFoundResponse({ description: 'Product tag not found' })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  updateProductTag(@Body() updateProductTagDto: UpdateProductTagDto): Promise<void> {
    return this.rmqPublisher.request<void>(ProductTagRoutingKey.UPDATE, updateProductTagDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product tag' })
  @ApiNoContentResponse({ description: 'Product tag deleted successfully' })
  @ApiNotFoundResponse({ description: 'Product tag not found' })
  deleteProductTag(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.rmqPublisher.request<void>(ProductTagRoutingKey.DELETE, id);
  }
}
