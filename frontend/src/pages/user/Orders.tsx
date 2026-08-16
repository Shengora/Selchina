import { useEffect, useState } from 'react';
import { api } from '../../services/api';

export function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders')
      .then(res => setOrders(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4">Loading orders...</div>;
  if (orders.length === 0) return <div className="p-4 text-center mt-20 text-tg-hint">No orders yet</div>;

  return (
    <div className="p-4 space-y-4 pb-20">
      <h2 className="text-xl font-bold mb-4">My Orders</h2>
      {orders.map(order => (
        <div key={order.id} className="bg-tg-secondaryBg rounded-2xl p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-tg-hint">#{order.id.split('-')[0]}</span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium \${
              order.status === 'delivered' ? 'bg-green-100 text-green-700' :
              order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {order.status.toUpperCase()}
            </span>
          </div>
          <div className="space-y-2 mb-3">
            {order.order_items.map((item: any) => (
               <div key={item.id} className="flex justify-between text-sm">
                 <span>{item.quantity}x {item.products?.name || 'Product'}</span>
                 <span>${item.total_price}</span>
               </div>
            ))}
          </div>
          <div className="pt-3 border-t border-tg-hint/20 flex justify-between font-bold">
             <span>Total</span>
             <span>${order.total_amount}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
