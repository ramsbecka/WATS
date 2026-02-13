// Common types for mobile app

export interface Category {
  id: string;
  name_en?: string;
  slug: string;
  image_url?: string;
  parent_id?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface Product {
  id: string;
  name_en?: string;
  price_tzs: number;
  compare_at_price_tzs?: number | null;
  product_images?: { url: string }[];
  product_reviews?: { rating: number }[];
  average_rating?: number;
  total_reviews?: number;
  order_count?: number;
  category_id?: string;
  vendor_id?: string;
  is_active?: boolean;
}

export interface SubCategory extends Category {
  parent_id: string;
}
