import { useEffect, useState } from 'react';
import { api } from '../../services/api';

export function OrdersManager() {
  const [orders, setOrders] = useState<any[]>([]);

  const fetchOrders = () => {
    api.get('/admin/orders').then(res => setOrders(res.data)).catch(console.error);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.put(`/admin/orders/\${id}/status`, { status });
      fetchOrders();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-4 pb-20">
      <h2 className="text-xl font-bold mb-4">Manage Orders</h2>
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-tg-secondaryBg p-4 rounded-xl">
             <div className="font-semibold">{order.customer_name} ({order.customer_phone})</div>
             <div className="text-sm text-tg-hint mb-3">{order.shipping_address}</div>

             <select
               className="w-full p-2 rounded-lg bg-tg-bg border border-tg-hint/30"
               value={order.status}
               onChange={(e) => handleStatusChange(order.id, e.target.value)}
             >
               <option value="pending">Pending</option>
               <option value="confirmed">Confirmed</option>
               <option value="preparing">Preparing</option>
               <option value="delivering">Delivering</option>
               <option value="delivered">Delivered</option>
               <option value="cancelled">Cancelled</option>
             </select>
          </div>
        ))}
      </div>
    </div>
  );
}
