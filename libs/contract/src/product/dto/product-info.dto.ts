/**
 * DTO dùng trong workflow để trả về thông tin sản phẩm sau khi validate.
 * KHÔNG dùng class-validator/swagger vì file này sẽ được import trong Temporal workflow sandbox.
 */
export interface ProductInfo {
  product_id: number;
  name: string;
  price: number;
}

export interface ProductValidationResult {
  valid: boolean;
  products: ProductInfo[];
}
