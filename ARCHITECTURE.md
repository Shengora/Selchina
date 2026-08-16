# E-Commerce Telegram Mini App Architecture

This document describes the architecture, database schema, authentication flow, and project structure for the E-Commerce Telegram Mini App.

## 1. Project Architecture

The project is built as a Monorepo containing:
- `/frontend`: React + TypeScript + Vite. It uses Tailwind CSS for styling and connects to Telegram WebApp APIs.
- `/backend`: Node.js + TypeScript + Express + grammY. It handles business logic, database interaction, API endpoints, and the Telegram bot logic.
- `/shared`: Common TypeScript types, interfaces, and Zod validation schemas shared between frontend and backend.
- `supabase`: Supabase SQL migrations, schemas, RLS policies.

## 2. Database Schema (Supabase PostgreSQL)

**Tables:**

1. **`users`**
   - `id` (bigint, PK) - Telegram User ID
   - `first_name` (text)
   - `last_name` (text, nullable)
   - `username` (text, nullable)
   - `is_admin` (boolean, default false)
   - `created_at` (timestamptz)

2. **`categories`**
   - `id` (uuid, PK)
   - `name` (text)
   - `description` (text, nullable)
   - `is_active` (boolean, default true)
   - `created_at` (timestamptz)

3. **`products`**
   - `id` (uuid, PK)
   - `category_id` (uuid, FK to categories, nullable)
   - `name` (text)
   - `description` (text)
   - `price` (numeric, not null)
   - `discount_price` (numeric, nullable)
   - `stock_quantity` (integer, default 0, check >= 0)
   - `sku` (text, unique, nullable)
   - `is_active` (boolean, default true)
   - `created_at` (timestamptz)
   - `updated_at` (timestamptz)

4. **`product_images`**
   - `id` (uuid, PK)
   - `product_id` (uuid, FK to products, ON DELETE CASCADE)
   - `url` (text)
   - `is_primary` (boolean, default false)
   - `created_at` (timestamptz)

5. **`product_variants`**
   - `id` (uuid, PK)
   - `product_id` (uuid, FK to products, ON DELETE CASCADE)
   - `name` (text) - e.g., "Color", "Size"
   - `value` (text) - e.g., "Red", "XL"
   - `stock_quantity` (integer, nullable) - specific stock for variant if needed
   - `price_adjustment` (numeric, default 0)

6. **`cart_items`**
   - `id` (uuid, PK)
   - `user_id` (bigint, FK to users)
   - `product_id` (uuid, FK to products)
   - `variant_id` (uuid, FK to product_variants, nullable)
   - `quantity` (integer, default 1, check > 0)
   - `created_at` (timestamptz)
   - `updated_at` (timestamptz)

7. **`orders`**
   - `id` (uuid, PK)
   - `user_id` (bigint, FK to users)
   - `status` (text) - enum: pending, confirmed, preparing, delivering, delivered, cancelled
   - `total_amount` (numeric)
   - `shipping_address` (text)
   - `customer_name` (text)
   - `customer_phone` (text)
   - `notes` (text, nullable)
   - `created_at` (timestamptz)
   - `updated_at` (timestamptz)

8. **`order_items`**
   - `id` (uuid, PK)
   - `order_id` (uuid, FK to orders, ON DELETE CASCADE)
   - `product_id` (uuid, FK to products)
   - `variant_id` (uuid, FK to product_variants, nullable)
   - `quantity` (integer)
   - `unit_price` (numeric) - locked price at the time of purchase
   - `total_price` (numeric)

9. **`payments`**
   - `id` (uuid, PK)
   - `order_id` (uuid, FK to orders)
   - `amount` (numeric)
   - `method` (text) - e.g., cash, card, click, payme
   - `status` (text) - enum: pending, completed, failed, refunded
   - `created_at` (timestamptz)

## 3. Authentication & Authorization Flow

1. **Telegram WebApp Initialization:**
   - User opens Mini App. Telegram client provides `window.Telegram.WebApp.initData`.
   - Frontend sends `initData` to backend in the `Authorization` header as a Bearer token.
2. **Backend Validation:**
   - Backend receives `initData`.
   - Uses the `TELEGRAM_BOT_TOKEN` to generate a secret key using HMAC-SHA256.
   - Validates the `hash` in `initData` against the calculated hash.
   - If valid, parses `user` info from `initData` and extracts `user.id`.
3. **Database Sync & Token Generation (Optional but recommended):**
   - Backend upserts user details into `users` table.
   - Attach user info to `req.user` for downstream routes.
4. **Admin Authorization:**
   - Specific API routes check `req.user.is_admin` or if `req.user.id` exists in the `ADMIN_IDS` environment variable.
   - Only authorized admins can access dashboard, product management, and order status changes.

## 4. API Architecture

- **Auth Middleware:** Validates Telegram `initData`.
- **Admin Middleware:** Validates if the authenticated user is an admin.
- **RESTful Endpoints:**
  - `GET /api/products` (Public)
  - `GET /api/products/:id` (Public)
  - `GET /api/categories` (Public)
  - `GET /api/cart` (Auth)
  - `POST /api/cart` (Auth)
  - `PUT /api/cart/:id` (Auth)
  - `DELETE /api/cart/:id` (Auth)
  - `POST /api/checkout` (Auth) - handles stock decrement and order creation safely.
  - `GET /api/orders` (Auth)
  - `GET /api/orders/:id` (Auth)
  - `GET /api/admin/stats` (Admin)
  - `POST /api/admin/products` (Admin)
  - `PUT /api/admin/products/:id` (Admin)
  - `DELETE /api/admin/products/:id` (Admin)
  - `PUT /api/admin/orders/:id/status` (Admin)

## 5. Security & Stock Integrity (Race Conditions)

- **Stock Verification:** During checkout, the backend fetches current stock within a PostgreSQL transaction.
- **Atomic Operations:** Stock decrement is handled in the database securely (e.g., `UPDATE products SET stock_quantity = stock_quantity - X WHERE id = Y AND stock_quantity >= X`). If no rows are updated, it implies insufficient stock, and the transaction is aborted.
- **RLS Policies:** Supabase Row Level Security will ensure that API keys from frontend (if used directly, though we use backend primarily) can only access authorized data. The backend will use `service_role` key safely out of reach from clients.
- **Pricing Verification:** Order total is ALWAYS calculated on the backend using prices fetched from the database, ignoring frontend-provided totals.

## 6. Frontend Structure

- `src/components`: UI components (Button, Input, Card, Modal, etc).
- `src/pages`: User pages (Home, ProductDetails, Cart, Checkout, Profile).
- `src/pages/admin`: Admin pages (Dashboard, ProductsManager, OrdersManager).
- `src/services`: API client functions (axios/fetch).
- `src/store` or Context: State management (Cart state, User state).
- `src/hooks`: Custom hooks (useTelegram, useAuth).

## 7. Telegram Bot Commands

- `/start`: Replies with an inline keyboard button to open the Web App. Checks if user is admin to show an extra "Admin Panel" button.
- `/shop`: Link to open Web App shop.
- `/orders`: Link to open orders page.
- `/help`: Information about the bot.
