import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';

export function AdminDashboard() {
  const [stats, setStats] = useState({ ordersCount: 0, totalSales: 0, productsCount: 0 });

  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data)).catch(console.error);
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold mb-4">Admin Dashboard</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-tg-secondaryBg p-4 rounded-2xl">
           <div className="text-tg-hint text-sm">Total Sales</div>
           <div className="text-2xl font-bold">${stats.totalSales.toFixed(2)}</div>
        </div>
        <div className="bg-tg-secondaryBg p-4 rounded-2xl">
           <div className="text-tg-hint text-sm">Orders</div>
           <div className="text-2xl font-bold">{stats.ordersCount}</div>
        </div>
        <div className="bg-tg-secondaryBg p-4 rounded-2xl col-span-2">
           <div className="text-tg-hint text-sm">Products</div>
           <div className="text-2xl font-bold">{stats.productsCount}</div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
         <Link to="/admin/products" className="bg-tg-button text-white text-center p-3 rounded-xl font-medium">Manage Products</Link>
         <Link to="/admin/orders" className="bg-tg-secondaryBg text-tg-text text-center p-3 rounded-xl font-medium">Manage Orders</Link>
      </div>
    </div>
  );
}
