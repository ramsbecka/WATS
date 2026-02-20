'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    let q = supabase
      .from('orders')
      .select('id, order_number, status, total_tzs, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (statusFilter) q = q.eq('status', statusFilter);
    q.then(({ data, error }) => {
      if (!error) setOrders(data ?? []);
      setLoading(false);
    });
  }, [statusFilter]);

  const statusStyle: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-800 border-amber-200',
    confirmed: 'bg-blue-50 text-blue-800 border-blue-200',
    processing: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    shipped: 'bg-violet-50 text-violet-800 border-violet-200',
    delivered: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Orders</h1>
          <p className="mt-1 text-sm text-slate-500">View and manage all orders</p>
        </div>
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-card focus:border-primary/40"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </header>
      <div className="overflow-hidden rounded-panel border border-slate-200/90 bg-white shadow-card">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm font-medium">Loading orders…</span>
          </div>
        ) : (
          <table className="table-row-hover min-w-full divide-y divide-slate-100">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Order</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Total (TZS)</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                <th className="w-10 px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/orders/${o.id}`}
                      className="font-semibold text-primary hover:text-primary-dark hover:underline"
                    >
                      {o.order_number}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${statusStyle[o.status] ?? 'bg-slate-100 text-slate-700 border-slate-200'}`}
                    >
                      {o.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm font-semibold tabular-nums text-slate-900">
                    {Number(o.total_tzs).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{new Date(o.created_at).toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/orders/${o.id}`}
                      className="inline-flex items-center rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-primary/10 hover:text-primary"
                      aria-label="View order"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-500">
            <p className="text-sm font-medium">No orders yet</p>
            <p className="text-xs">Orders will appear here when customers place them.</p>
          </div>
        )}
      </div>
    </div>
  );
}
