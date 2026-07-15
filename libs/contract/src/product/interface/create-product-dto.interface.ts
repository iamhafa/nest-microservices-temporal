export interface ICreateProductDto {
  name: string;
  description?: string;
  price: number;
  quantity?: number;
  image_urls?: string[];
  category_id?: number;
  brand_id?: number;
  tag_ids?: number[];
  attributes?: Record<string, string>;
}
