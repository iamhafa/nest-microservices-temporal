import { RmqPublisherService } from '@libs/common';
import { CreateProductBrandDto, UpdateProductBrandDto } from './dto';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

@ApiBearerAuth('Authorization')
@ApiTags('Product Brand')
@Controller('product-brands')
export class ProductBrandController {
  constructor(private readonly rmqPublisher: RmqPublisherService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Create a product brand' })
  @ApiAcceptedResponse({ description: 'Product brand creation initiated' })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  createProductBrand(@Body() createProductBrandDto: CreateProductBrandDto): Promise<any> {
    return this.rmqPublisher.request('productBrand.create.command', createProductBrandDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all product brands' })
  @ApiOkResponse({ description: 'List of product brands' })
  getProductBrands(): Promise<any[]> {
    return this.rmqPublisher.request('productBrand.getAll.query', {});
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product brand by ID' })
  @ApiOkResponse({ description: 'Product brand details' })
  @ApiNotFoundResponse({ description: 'Product brand not found' })
  getProductBrand(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return this.rmqPublisher.request('productBrand.get.query', id);
  }

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update a product brand' })
  @ApiNoContentResponse({ description: 'Product brand updated successfully' })
  @ApiNotFoundResponse({ description: 'Product brand not found' })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  updateProductBrand(@Body() updateProductBrandDto: UpdateProductBrandDto): Promise<any> {
    return this.rmqPublisher.request('productBrand.update.command', updateProductBrandDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product brand' })
  @ApiNoContentResponse({ description: 'Product brand deleted successfully' })
  @ApiNotFoundResponse({ description: 'Product brand not found' })
  deleteProductBrand(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return this.rmqPublisher.request('productBrand.delete.command', id);
  }
}
