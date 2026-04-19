import { CreateProductDto, UpdateProductDto } from '@libs/contract/product/dto';

export interface IProductActivity {
  /**
   * Xác thực siêu dữ liệu sản phẩm (Danh mục, Thương hiệu, Tags)
   */
  validateProductMetadata(productDto: CreateProductDto | UpdateProductDto): Promise<void>;

  /**
   * Xác thực sản phẩm (Kiểm tra sản phẩm có tồn tại không)
   */
  validateProducts(productIds: number[]): Promise<boolean>;

  /**
   * Tạo sản phẩm (Khi tạo sản phẩm thì cần phải khởi tạo tồn kho)
   */
  createProduct(createProductDto: Omit<CreateProductDto, 'quantity'>): Promise<number>;

  /**
   * Xóa sản phẩm (Khi xóa sản phẩm thì cần phải xóa tồn kho)
   */
  deleteProduct(productId: number): Promise<void>;

  /**
   * Lấy giá sản phẩm theo danh sách ID
   */
  getProductPrices(productIds: number[]): Promise<Record<number, number>>;

  /**
   * Generate an embedding vector based on product data (name, desc, tags, category, brand)
   */
  generateProductEmbedding(productId: number): Promise<void>;
}
