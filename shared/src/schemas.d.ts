import { z } from 'zod';
export declare const ProductSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    price: z.ZodNumber;
    discount_price: z.ZodOptional<z.ZodNumber>;
    stock_quantity: z.ZodNumber;
    category_id: z.ZodOptional<z.ZodString>;
    sku: z.ZodOptional<z.ZodString>;
    is_active: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
//# sourceMappingURL=schemas.d.ts.map