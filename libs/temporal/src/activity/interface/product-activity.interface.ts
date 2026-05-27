import { CreateProductDto, UpdateProductDto } from '@libs/contract/product/dto';

// Xác thực thông tin sản phẩm
export interface IValidateProductMetadata {
  execute(productDto: CreateProductDto | UpdateProductDto): Promise<void>;
}

// Xác thực danh sách sản phẩm
export interface IValidateProducts {
  execute(productIds: number[]): Promise<boolean>;
}

// Tạo sản phẩm
export interface ICreateProduct {
  execute(createProductDto: Omit<CreateProductDto, 'quantity'>): Promise<number>;
}

// Xoá sản phẩm
export interface IDeleteProduct {
  execute(productId: number): Promise<void>;
}

// Lấy giá sản phẩm
export interface IGetProductPrices {
  execute(productIds: number[]): Promise<Record<number, number>>;
}

