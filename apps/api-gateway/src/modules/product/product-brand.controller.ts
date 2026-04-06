import { CreateProductBrandDto } from '@libs/contract/product-brand/dto/create-product-brand.dto';
import { UpdateProductBrandDto } from '@libs/contract/product-brand/dto/update-product-brand.dto';
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
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';

@ApiBearerAuth('Authorization')
@ApiTags('Product Brand')
@Controller('product-brands')
export class ProductBrandController {
  constructor(@Inject('PRODUCT_SERVICE_CLIENT') private readonly productServiceClient: ClientProxy) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Create a product brand' })
  @ApiAcceptedResponse({ description: 'Product brand creation initiated' })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  createProductBrand(@Body() createProductBrandDto: CreateProductBrandDto): Observable<any> {
    return this.productServiceClient.send({ cmd: 'create-product-brand' }, createProductBrandDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all product brands' })
  @ApiOkResponse({ description: 'List of product brands' })
  getProductBrands(): Observable<any[]> {
    return this.productServiceClient.send({ cmd: 'get-product-brands' }, {});
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product brand by ID' })
  @ApiOkResponse({ description: 'Product brand details' })
  @ApiNotFoundResponse({ description: 'Product brand not found' })
  getProductBrand(@Param('id', ParseIntPipe) id: number): Observable<any> {
    return this.productServiceClient.send({ cmd: 'get-product-brand' }, id);
  }

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update a product brand' })
  @ApiNoContentResponse({ description: 'Product brand updated successfully' })
  @ApiNotFoundResponse({ description: 'Product brand not found' })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  updateProductBrand(@Body() updateProductBrandDto: UpdateProductBrandDto): Observable<any> {
    return this.productServiceClient.send({ cmd: 'update-product-brand' }, updateProductBrandDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product brand' })
  @ApiNoContentResponse({ description: 'Product brand deleted successfully' })
  @ApiNotFoundResponse({ description: 'Product brand not found' })
  deleteProductBrand(@Param('id', ParseIntPipe) id: number): Observable<any> {
    return this.productServiceClient.send({ cmd: 'delete-product-brand' }, id);
  }
}
