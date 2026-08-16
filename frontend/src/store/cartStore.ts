import { create } from 'zustand';
import { api } from '../services/api';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    id: string;
    name: string;
    price: number;
    discount_price?: number;
    stock_quantity: number;
    product_images: { url: string }[];
  };
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,
  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/cart');
      set({ items: data });
    } catch (error) {
      console.error('Failed to fetch cart', error);
    } finally {
      set({ isLoading: false });
    }
  },
  addToCart: async (productId, quantity) => {
    try {
      await api.post('/cart', { product_id: productId, quantity });
      await get().fetchCart();
    } catch (error) {
      throw error;
    }
  },
  updateQuantity: async (id, quantity) => {
    try {
      await api.put(`/cart/\${id}`, { quantity });
      await get().fetchCart();
    } catch (error) {
      throw error;
    }
  },
  removeFromCart: async (id) => {
    try {
      await api.delete(`/cart/\${id}`);
      set(state => ({ items: state.items.filter(i => i.id !== id) }));
    } catch (error) {
      console.error('Failed to remove item', error);
    }
  },
  clearCart: () => set({ items: [] })
}));
