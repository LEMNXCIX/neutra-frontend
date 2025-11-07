"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

type OrderItem = { id: string; name: string; qty: number };
type Order = { id: string; userId: string; total: number; items: OrderItem[]; date: string; status?: string; address?: string; tracking?: string };

export default function ProfilePage(){
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      const qp = new URLSearchParams();
      qp.set('userId', user.id);
      qp.set('page', String(page));
      qp.set('pageSize', String(pageSize));
      if (statusFilter) qp.set('status', statusFilter);
      if (dateFrom) qp.set('dateFrom', dateFrom);
      if (dateTo) qp.set('dateTo', dateTo);
      fetch(`/api/orders?${qp.toString()}`)
        .then(r=>r.json())
        .then(d=>{ setOrders(d.orders || []); setTotal(d.total || 0); });
    }
  }, [user, loading, router, page, pageSize, statusFilter, dateFrom, dateTo]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return null; // redirecting

  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-semibold">My profile</h1>
      <div className="mt-4 space-y-1 text-sm text-muted-foreground">
        <div>Name: {user.name}</div>
        <div>Email: {user.email}</div>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Orders</h2>

        <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="border px-2 py-1 rounded text-sm w-full sm:w-auto">
            <option value="">All statuses</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
          <div className="flex gap-2 w-full sm:w-auto">
            <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="border px-2 py-1 rounded text-sm" />
            <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="border px-2 py-1 rounded text-sm" />
          </div>
          <div className="w-full sm:w-auto">
            <button onClick={()=>setPage(1)} className="w-full sm:w-auto px-3 py-1 bg-zinc-900 text-white rounded text-sm">Apply</button>
          </div>
        </div>

        {orders === null ? (
          <div className="p-4">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-4 text-muted-foreground">No orders found.</div>
        ) : (
          <>
            <ul className="mt-4 space-y-4">
              {orders.map((o: Order) => (
                <li key={o.id} className="border rounded p-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="font-medium">Order {o.id}</div>
                      <div className="text-sm text-muted-foreground">{o.date} • {o.status}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-sm font-semibold">${o.total}</div>
                      <button onClick={()=>setExpanded(expanded === o.id ? null : o.id)} className="px-2 py-1 border rounded text-sm">{expanded === o.id ? 'Hide' : 'View'}</button>
                      <a href={`/api/orders/${o.id}/receipt`} target="_blank" rel="noreferrer" className="px-2 py-1 bg-zinc-900 text-white rounded text-sm">Download receipt</a>
                    </div>
                  </div>

                  {expanded === o.id && (
                    <div className="mt-3 text-sm">
                      <div><strong>Address:</strong> {o.address}</div>
                      <div><strong>Tracking:</strong> {o.tracking || '—'}</div>
                      <div className="mt-2"><strong>Items:</strong>
                        <ul className="mt-1 ml-4 list-disc">
                          {o.items.map(it => <li key={it.id}>{it.qty}× {it.name}</li>)}
                        </ul>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">Showing {orders.length} of {total} orders</div>
              <div className="flex items-center gap-2">
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="px-3 py-1 border rounded">Prev</button>
                <div className="px-3 py-1">{page}</div>
                <button onClick={()=>setPage(p=>p+1)} disabled={page * pageSize >= total} className="px-3 py-1 border rounded">Next</button>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
