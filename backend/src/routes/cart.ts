import { Router } from 'express';
import { supabase } from '../services/supabase';
import { AuthRequest, authenticateWebApp } from '../middlewares/auth';

const router = Router();
router.use(authenticateWebApp);

router.get('/', async (req: AuthRequest, res) => {
  const userId = req.user?.id;

  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      *,
      products(*, product_images(url))
    `)
    .eq('user_id', userId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

router.post('/', async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { product_id, variant_id, quantity } = req.body;

  // Check stock
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('stock_quantity')
    .eq('id', product_id)
    .single();

  if (productError || !product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  if (product.stock_quantity < quantity) {
    return res.status(400).json({ error: 'Insufficient stock' });
  }

  // Check if item already exists in cart
  const { data: existingItem } = await supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', userId)
    .eq('product_id', product_id)
    .is('variant_id', variant_id || null)
    .maybeSingle();

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;
    if (product.stock_quantity < newQuantity) {
        return res.status(400).json({ error: 'Insufficient stock' });
    }
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: newQuantity })
      .eq('id', existingItem.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  const { data, error } = await supabase
    .from('cart_items')
    .insert({
      user_id: userId,
      product_id,
      variant_id,
      quantity
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  const userId = req.user?.id;

  const { data: cartItem } = await supabase
    .from('cart_items')
    .select('product_id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (!cartItem) return res.status(404).json({ error: 'Cart item not found' });

  const { data: product } = await supabase
    .from('products')
    .select('stock_quantity')
    .eq('id', cartItem.product_id)
    .single();

  if (!product || product.stock_quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
  }

  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;
