"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../services/supabase");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateWebApp);
router.post('/checkout', async (req, res) => {
    const userId = req.user?.id;
    const { shipping_address, customer_name, customer_phone, notes, payment_method } = req.body;
    try {
        // 1. Calculate total amount defensively before hitting the database function
        const { data: cartItems, error: cartError } = await supabase_1.supabase
            .from('cart_items')
            .select('*, products(id, price, discount_price, stock_quantity)')
            .eq('user_id', userId);
        if (cartError || !cartItems || cartItems.length === 0) {
            return res.status(400).json({ error: 'Cart is empty or could not be fetched' });
        }
        let totalAmount = 0;
        for (const item of cartItems) {
            if (item.quantity > item.products.stock_quantity) {
                return res.status(400).json({ error: `Insufficient stock for product ${item.products.id}` });
            }
            const unitPrice = item.products.discount_price || item.products.price;
            totalAmount += unitPrice * item.quantity;
        }
        // 2. Execute full checkout atomic transaction using RPC
        const { data: orderId, error: rpcError } = await supabase_1.supabase.rpc('process_checkout', {
            p_user_id: userId,
            p_total_amount: totalAmount,
            p_shipping_address: shipping_address,
            p_customer_name: customer_name,
            p_customer_phone: customer_phone,
            p_notes: notes || '',
            p_payment_method: payment_method || 'cash'
        });
        if (rpcError) {
            console.error('Checkout RPC error:', rpcError);
            return res.status(400).json({ error: rpcError.message || 'Checkout failed' });
        }
        // 3. Fetch the newly created order
        const { data: order } = await supabase_1.supabase.from('orders').select('*').eq('id', orderId).single();
        res.status(201).json(order);
    }
    catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({ error: error.message });
    }
});
router.get('/', async (req, res) => {
    const userId = req.user?.id;
    const { data, error } = await supabase_1.supabase
        .from('orders')
        .select('*, order_items(*, products(name, product_images(url)))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
router.get('/:id', async (req, res) => {
    const userId = req.user?.id;
    const { id } = req.params;
    const { data, error } = await supabase_1.supabase
        .from('orders')
        .select('*, order_items(*, products(*, product_images(url))), payments(*)')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
    if (error)
        return res.status(404).json({ error: 'Order not found' });
    res.json(data);
});
exports.default = router;
