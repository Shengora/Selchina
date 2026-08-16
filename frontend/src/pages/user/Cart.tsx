import { useEffect, useState } from 'react';
import { useCartStore } from '../../store/cartStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TrashIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import WebApp from '@twa-dev/sdk';
import { useNavigate } from 'react-router-dom';

export function Cart() {
  const { items, fetchCart, updateQuantity, removeFromCart, isLoading, clearCart } = useCartStore();
  const [checkoutMode, setCheckoutMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const total = items.reduce((sum, item) => {
    const price = item.products.discount_price || item.products.price;
    return sum + price * item.quantity;
  }, 0);

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const { data } = await api.post('/orders/checkout', {
        shipping_address: formData.get('address'),
        customer_name: formData.get('name'),
        customer_phone: formData.get('phone'),
        notes: formData.get('notes'),
      });
      toast.success('Order placed successfully!');
      clearCart();
      WebApp.HapticFeedback.notificationOccurred('success');
      navigate('/orders');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Checkout failed');
    }
  };

  if (isLoading) return <div className="p-4">Loading cart...</div>;
  if (items.length === 0) return <div className="p-4 text-center mt-20 text-tg-hint">Your cart is empty</div>;

  if (checkoutMode) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Checkout</h2>
        <form onSubmit={handleCheckout} className="space-y-4">
          <Input name="name" label="Full Name" required defaultValue={WebApp.initDataUnsafe?.user?.first_name} />
          <Input name="phone" label="Phone Number" required type="tel" />
          <Input name="address" label="Delivery Address" required />
          <Input name="notes" label="Notes (optional)" />
          <div className="pt-4 flex gap-4">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setCheckoutMode(false)}>Back</Button>
            <Button variant="primary" className="flex-1" type="submit">Pay ${total.toFixed(2)}</Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      <h2 className="text-xl font-bold mb-4">Shopping Cart</h2>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4 bg-tg-secondaryBg p-3 rounded-2xl items-center">
            <div className="w-16 h-16 bg-gray-200 rounded-xl overflow-hidden shrink-0">
               {item.products.product_images?.[0] && (
                 <img src={item.products.product_images[0].url} alt="" className="w-full h-full object-cover" />
               )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{item.products.name}</h3>
              <p className="text-tg-button font-medium">
                 ${item.products.discount_price || item.products.price}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button onClick={() => removeFromCart(item.id)} className="text-red-500 p-1">
                <TrashIcon className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 bg-tg-bg rounded-lg p-1">
                 <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                    <MinusIcon className="w-4 h-4" />
                 </button>
                 <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                 <button onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.products.stock_quantity}>
                    <PlusIcon className="w-4 h-4" />
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="fixed bottom-16 left-0 w-full p-4 bg-tg-bg border-t border-tg-hint/20">
         <Button variant="primary" className="w-full" onClick={() => setCheckoutMode(true)}>
           Checkout (${total.toFixed(2)})
         </Button>
      </div>
    </div>
  );
}
