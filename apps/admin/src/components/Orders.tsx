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

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Orders</h1>
          <p className="mt-1 text-sm text-slate-500">All orders</p>
        </div>
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-slate-500">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Loading...
          </div>
        ) : (
          <table className="table-row-hover min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Order</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Total (TZS)</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-5 py-3.5">
                    <Link href={`/orders/${o.id}`} className="font-medium text-primary hover:text-primary-dark">
                      {o.order_number}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700">
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm font-medium text-slate-900">{Number(o.total_tzs).toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{new Date(o.created_at).toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/orders/${o.id}`} className="inline-flex items-center text-slate-400 hover:text-primary">
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && orders.length === 0 && (
          <div className="p-12 text-center text-slate-500">No orders.</div>
        )}
      </div>
    </div>
  );
}
