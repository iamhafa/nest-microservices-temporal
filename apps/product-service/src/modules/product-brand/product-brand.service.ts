import { CreateProductBrandDto } from '@libs/contract/product-brand/dto/create-product-brand.dto';
import { UpdateProductBrandDto } from '@libs/contract/product-brand/dto/update-product-brand.dto';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductBrandEntity } from './entity/product-brand.entity';

@Injectable()
export class ProductBrandService {
  constructor(
    @InjectRepository(ProductBrandEntity)
    private readonly productBrandRepository: Repository<ProductBrandEntity>,
  ) {}

  async createProductBrand(dto: CreateProductBrandDto): Promise<ProductBrandEntity> {
    const brand = this.productBrandRepository.create(dto);
    return this.productBrandRepository.save(brand);
  }

  getProductBrands(): Promise<ProductBrandEntity[]> {
    return this.productBrandRepository.find();
  }

  async getProductBrand(id: number): Promise<ProductBrandEntity> {
    const brand = await this.productBrandRepository.findOne({ where: { id } });
    if (!brand) {
      throw new RpcException({ status: 404, message: `Product brand #${id} not found` });
    }
    return brand;
  }

  async updateProductBrand(dto: UpdateProductBrandDto): Promise<void> {
    const { id, ...updateData } = dto;
    const result = await this.productBrandRepository.update(id, updateData);
    if (result.affected === 0) {
      throw new RpcException({ status: 404, message: `Product brand #${id} not found` });
    }
  }

  async deleteProductBrand(id: number): Promise<void> {
    const brand = await this.getProductBrand(id);
    await this.productBrandRepository.softDelete(brand.id);
  }
}
