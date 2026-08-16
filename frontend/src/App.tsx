import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { Toaster } from 'react-hot-toast';
import { HomeIcon, ShoppingCartIcon, ClipboardDocumentListIcon, UserIcon, CogIcon } from '@heroicons/react/24/outline';

import { Home } from "./pages/user/Home";
import { Cart } from "./pages/user/Cart";
import { Orders } from "./pages/user/Orders";
import { Profile } from "./pages/user/Profile";

import { AdminDashboard } from "./pages/admin/Dashboard";
import { ProductsManager } from "./pages/admin/ProductsManager";
import { OrdersManager } from "./pages/admin/OrdersManager";

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  const navItems = isAdmin ? [
    { path: '/admin', icon: CogIcon, label: 'Dashboard' },
    { path: '/admin/products', icon: ShoppingCartIcon, label: 'Products' },
    { path: '/admin/orders', icon: ClipboardDocumentListIcon, label: 'Orders' },
    { path: '/', icon: HomeIcon, label: 'Exit Admin' },
  ] : [
    { path: '/', icon: HomeIcon, label: 'Shop' },
    { path: '/cart', icon: ShoppingCartIcon, label: 'Cart' },
    { path: '/orders', icon: ClipboardDocumentListIcon, label: 'Orders' },
    { path: '/profile', icon: UserIcon, label: 'Profile' },
  ];

  return (
    <div className="pb-16 min-h-screen bg-tg-bg text-tg-text">
      {children}
      <nav className="fixed bottom-0 w-full bg-tg-secondaryBg border-t border-tg-hint/20 flex justify-around p-2 pb-safe">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link key={path} to={path} className={`flex flex-col items-center p-2 \${isActive ? 'text-tg-button' : 'text-tg-hint'}`}>
              <Icon className="w-6 h-6" />
              <span className="text-[10px] mt-1">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function App() {
  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
  }, []);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/profile" element={<Profile />} />

          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<ProductsManager />} />
          <Route path="/admin/orders" element={<OrdersManager />} />
        </Routes>
      </Layout>
      <Toaster position="top-center" />
    </BrowserRouter>
  );
}

export default App;
