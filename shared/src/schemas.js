"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductSchema = void 0;
const zod_1 = require("zod");
exports.ProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    description: zod_1.z.string().min(1, 'Description is required'),
    price: zod_1.z.number().min(0, 'Price must be positive'),
    discount_price: zod_1.z.number().min(0).optional(),
    stock_quantity: zod_1.z.number().int().min(0),
    category_id: zod_1.z.string().uuid().optional(),
    sku: zod_1.z.string().optional(),
    is_active: zod_1.z.boolean().default(true),
});
//# sourceMappingURL=schemas.js.map