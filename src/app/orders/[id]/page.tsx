import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';

type OrderItem = { id: string; name: string; qty: number; price: number };
type Order = { id: string; userId: string; total: number; status: string; tracking: string; address: string; items: OrderItem[]; date: string };

export default async function OrderPage(props: unknown) {
  const { params } = props as { params: { id: string } };
  const DATA = path.join(process.cwd(), 'src', 'data', 'orders.json');
  const raw = fs.readFileSync(DATA, 'utf-8');
  const orders = JSON.parse(raw) as Order[];
  const order = orders.find((o: Order) => o.id === params.id);
  if (!order) return notFound();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Order {order.id}</h1>
      <div className="mb-4">
        <div><strong>Status:</strong> {order.status}</div>
        <div><strong>Date:</strong> {order.date}</div>
        <div><strong>Address:</strong> {order.address}</div>
      </div>
      <div className="border p-4 rounded">
        <h2 className="text-lg font-medium mb-2">Items</h2>
        <ul className="space-y-2">
          {order.items.map(it => (
            <li key={it.id} className="flex justify-between">
              <div>
                <div className="font-medium">{it.name}</div>
                <div className="text-sm text-muted-foreground">Quantity: {it.qty} × ${it.price.toFixed(2)}</div>
              </div>
              <div className="font-medium">${(it.price * it.qty).toFixed(2)}</div>
            </li>
          ))}
        </ul>
        <div className="mt-4 text-right">
          <div className="text-lg font-semibold">Total: ${order.total.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
