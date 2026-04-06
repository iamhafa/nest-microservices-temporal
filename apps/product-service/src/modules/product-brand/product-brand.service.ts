import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductBrandEntity } from './entity/product-brand.entity';

@Injectable()
export class ProductBrandService {
  constructor(
    @InjectRepository(ProductBrandEntity)
    private readonly productBrandRepository: Repository<ProductBrandEntity>,
  ) {}
}
