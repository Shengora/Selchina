export interface User {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  is_admin: boolean;
}

export interface Product {
  id: string;
  category_id?: string;
  name: string;
  description: string;
  price: number;
  discount_price?: number;
  stock_quantity: number;
  sku?: string;
  is_active: boolean;
}

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: Product;
}
