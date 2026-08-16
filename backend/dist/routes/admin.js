"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../services/supabase");
const auth_1 = require("../middlewares/auth");
const grammy_1 = require("grammy");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '../.env' });
const router = (0, express_1.Router)();
router.use(auth_1.authenticateWebApp);
router.use(auth_1.requireAdmin);
const bot = new grammy_1.Bot(process.env.TELEGRAM_BOT_TOKEN || '');
// Stats
router.get('/stats', async (req, res) => {
    const { count: ordersCount } = await supabase_1.supabase.from('orders').select('*', { count: 'exact', head: true });
    const { data: salesData } = await supabase_1.supabase.from('orders').select('total_amount').eq('status', 'delivered');
    const { count: productsCount } = await supabase_1.supabase.from('products').select('*', { count: 'exact', head: true });
    const totalSales = salesData?.reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0;
    res.json({
        ordersCount,
        totalSales,
        productsCount
    });
});
// Manage Products
router.post('/products', async (req, res) => {
    const { data, error } = await supabase_1.supabase.from('products').insert(req.body).select().single();
    if (error)
        return res.status(400).json({ error: error.message });
    res.status(201).json(data);
});
router.put('/products/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase_1.supabase.from('products').update(req.body).eq('id', id).select().single();
    if (error)
        return res.status(400).json({ error: error.message });
    res.json(data);
});
router.delete('/products/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase_1.supabase.from('products').delete().eq('id', id);
    if (error)
        return res.status(400).json({ error: error.message });
    res.status(204).send();
});
// Manage Orders
router.get('/orders', async (req, res) => {
    const { data, error } = await supabase_1.supabase
        .from('orders')
        .select('*, users(first_name, last_name, username)')
        .order('created_at', { ascending: false });
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
router.put('/orders/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const { data, error } = await supabase_1.supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
    if (error)
        return res.status(400).json({ error: error.message });
    // Send notification to user
    if (data.user_id) {
        try {
            await bot.api.sendMessage(data.user_id, `📦 Your order #\${data.id.split('-')[0]} status has been updated to: \${status.toUpperCase()}`);
        }
        catch (err) {
            console.error('Failed to send telegram notification', err);
        }
    }
    res.json(data);
});
exports.default = router;
