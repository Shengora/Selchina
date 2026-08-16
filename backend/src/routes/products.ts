import { Router } from 'express';
import { supabase } from '../services/supabase';

const router = Router();

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories(name),
      product_images(url, is_primary)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories(name),
      product_images(url, is_primary),
      product_variants(id, name, value, stock_quantity, price_adjustment)
    `)
    .eq('id', id)
    .single();

  if (error) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.json(data);
});

router.get('/categories/all', async (req, res) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

export default router;
