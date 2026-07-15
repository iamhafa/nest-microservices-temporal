import type { ICreateProductDto, IUpdateProductDto } from '@libs/contract/product';

// Xác thực thông tin sản phẩm
export interface IValidateProductMetadataActivity {
  execute(productDto: ICreateProductDto | IUpdateProductDto): Promise<void>;
}

// Xác thực danh sách sản phẩm
export interface IValidateProductsActivity {
  execute(productIds: number[]): Promise<boolean>;
}

// Tạo sản phẩm
export interface ICreateProductActivity {
  execute(createProductDto: Omit<ICreateProductDto, 'quantity'>): Promise<number>;
}

// Xoá sản phẩm
export interface IDeleteProductActivity {
  execute(productId: number): Promise<void>;
}

// Lấy giá sản phẩm
export interface IGetProductPricesActivity {
  execute(productIds: number[]): Promise<Record<number, number>>;
}
