export interface IProductImageResponseDto {
  id: number;
  url: string;
  alt_text?: string;
  is_primary: boolean;
}

export interface IProductResponseDto {
  id: number;
  name: string;
  slug: string;
  description?: string;
  category_id?: number;
  brand_id?: number;
  price: number;
  currency: string;
  is_active: boolean;
  images?: IProductImageResponseDto[];
  attributes?: Record<string, string>;
}
