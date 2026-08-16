import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { useCartStore } from '../../store/cartStore';
import toast from 'react-hot-toast';
import WebApp from '@twa-dev/sdk';

export function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const addToCart = useCartStore((state) => state.addToCart);

  useEffect(() => {
    api.get('/products')
      .then((res) => setProducts(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (productId: string) => {
    try {
      WebApp.HapticFeedback.impactOccurred('light');
      await addToCart(productId, 1);
      toast.success('Added to cart');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add');
    }
  };

  if (loading) return <div className="p-4 text-center">Loading...</div>;

  return (
    <div className="p-4 grid grid-cols-2 gap-4">
      {products.map((p) => (
        <div key={p.id} className="bg-tg-secondaryBg rounded-2xl overflow-hidden flex flex-col">
          <div className="aspect-square bg-gray-200">
            {p.product_images?.[0] && (
              <img src={p.product_images[0].url} alt={p.name} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="p-3 flex-1 flex flex-col">
            <h3 className="font-semibold text-sm line-clamp-2">{p.name}</h3>
            <div className="mt-auto pt-2 flex items-center justify-between">
              <div>
                {p.discount_price ? (
                  <>
                    <span className="text-xs text-tg-hint line-through">${p.price}</span>
                    <span className="font-bold ml-1">${p.discount_price}</span>
                  </>
                ) : (
                  <span className="font-bold">${p.price}</span>
                )}
              </div>
              <Button
                variant="primary"
                className="w-8 h-8 p-0 rounded-full flex items-center justify-center text-lg"
                onClick={() => handleAdd(p.id)}
                disabled={p.stock_quantity === 0}
              >
                +
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
