export interface IUpdateProductDto {
  id: number;
  name?: string;
  description?: string;
  price?: number;
  image_urls?: string[];
  category_id?: number;
  brand_id?: number;
  tag_ids?: number[];
  attributes?: Record<string, string>;
}
