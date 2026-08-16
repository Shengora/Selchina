import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';

export function ProductsManager() {
  const [products, setProducts] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  const fetchProducts = () => {
    api.get('/products').then(res => setProducts(res.data)).catch(console.error);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await api.post('/admin/products', {
        name: formData.get('name'),
        description: formData.get('description'),
        price: Number(formData.get('price')),
        stock_quantity: Number(formData.get('stock')),
        is_active: true
      });
      toast.success('Product added');
      setShowAdd(false);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to add product');
    }
  };

  if (showAdd) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Add Product</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <Input name="name" label="Product Name" required />
          <Input name="description" label="Description" required />
          <Input name="price" label="Price" type="number" step="0.01" required />
          <Input name="stock" label="Stock Quantity" type="number" required />
          <div className="flex gap-4">
            <Button variant="secondary" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1" type="submit">Save</Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Products</h2>
        <Button variant="primary" onClick={() => setShowAdd(true)}>+ Add</Button>
      </div>
      <div className="space-y-3">
        {products.map(p => (
          <div key={p.id} className="bg-tg-secondaryBg p-3 rounded-xl flex justify-between items-center">
            <div>
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm text-tg-hint">Stock: {p.stock_quantity} | ${p.price}</div>
            </div>
            <Button variant="danger" onClick={async () => {
               if(confirm('Delete this product?')) {
                  await api.delete(`/admin/products/\${p.id}`);
                  fetchProducts();
               }
            }}>Delete</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
