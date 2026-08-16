-- Create tables
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT,
    username TEXT,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    discount_price NUMERIC(10, 2) CHECK (discount_price >= 0 AND discount_price < price),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    sku TEXT UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    value TEXT NOT NULL,
    stock_quantity INTEGER CHECK (stock_quantity >= 0),
    price_adjustment NUMERIC(10, 2) DEFAULT 0
);

CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id, variant_id)
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled')),
    total_amount NUMERIC(10, 2) NOT NULL,
    shipping_address TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) setup
-- We mostly rely on the backend API using the service_role key to bypass RLS,
-- but we enable it to secure direct database access if any.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active products and categories
CREATE POLICY "Public profiles are viewable by everyone" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Images are viewable by everyone" ON product_images FOR SELECT USING (true);
CREATE POLICY "Variants are viewable by everyone" ON product_variants FOR SELECT USING (true);

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at
BEFORE UPDATE ON cart_items
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RPC for atomic stock decrement
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  -- Select for update to lock the row
  SELECT stock_quantity INTO current_stock
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  IF current_stock >= p_quantity THEN
    UPDATE products
    SET stock_quantity = stock_quantity - p_quantity
    WHERE id = p_product_id;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- RPC for completely atomic checkout
CREATE OR REPLACE FUNCTION process_checkout(
    p_user_id BIGINT,
    p_total_amount NUMERIC,
    p_shipping_address TEXT,
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_notes TEXT,
    p_payment_method TEXT
)
RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_item RECORD;
    v_success BOOLEAN;
BEGIN
    -- 1. Create order
    INSERT INTO orders (user_id, status, total_amount, shipping_address, customer_name, customer_phone, notes)
    VALUES (p_user_id, 'pending', p_total_amount, p_shipping_address, p_customer_name, p_customer_phone, p_notes)
    RETURNING id INTO v_order_id;

    -- 2. Process cart items
    FOR v_item IN
        SELECT c.product_id, c.variant_id, c.quantity, p.price, p.discount_price, p.stock_quantity
        FROM cart_items c
        JOIN products p ON p.id = c.product_id
        WHERE c.user_id = p_user_id
    LOOP
        -- Atomic stock check & decrement
        IF v_item.stock_quantity < v_item.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for product %', v_item.product_id;
        END IF;

        UPDATE products
        SET stock_quantity = stock_quantity - v_item.quantity
        WHERE id = v_item.product_id;

        -- Insert order item
        INSERT INTO order_items (order_id, product_id, variant_id, quantity, unit_price, total_price)
        VALUES (
            v_order_id,
            v_item.product_id,
            v_item.variant_id,
            v_item.quantity,
            COALESCE(v_item.discount_price, v_item.price),
            COALESCE(v_item.discount_price, v_item.price) * v_item.quantity
        );
    END LOOP;

    -- 3. Insert Payment
    INSERT INTO payments (order_id, amount, method, status)
    VALUES (v_order_id, p_total_amount, p_payment_method, 'pending');

    -- 4. Clear cart
    DELETE FROM cart_items WHERE user_id = p_user_id;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;
