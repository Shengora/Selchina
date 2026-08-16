import { z } from 'zod';

export const ProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().min(0, 'Price must be positive'),
  discount_price: z.number().min(0).optional(),
  stock_quantity: z.number().int().min(0),
  category_id: z.string().uuid().optional(),
  sku: z.string().optional(),
  is_active: z.boolean().default(true),
});
