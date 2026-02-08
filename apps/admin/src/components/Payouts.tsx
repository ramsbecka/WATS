'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const PAID_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered'];

export default function Payouts() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [salesByVendor, setSalesByVendor] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [vRes, ordersRes] = await Promise.all([
        supabase.from('vendors').select('id, business_name, contact_phone, commission_rate').eq('is_approved', true),
        supabase.from('orders').select('id').in('status', PAID_STATUSES),
      ]);
      const list = vRes.data ?? [];
      setVendors(list);
      const orderIds = (ordersRes.data ?? []).map((o: any) => o.id);
      const byVendor: Record<string, number> = {};
      if (orderIds.length > 0) {
        const { data: items } = await supabase.from('order_items').select('vendor_id, total_tzs').in('order_id', orderIds);
        (items ?? []).forEach((row: any) => {
          const id = row.vendor_id;
          byVendor[id] = (byVendor[id] ?? 0) + Number(row.total_tzs || 0);
        });
      }
      setSalesByVendor(byVendor);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payouts & reports</h1>
      <p className="mt-1 text-sm text-slate-500">Vendor sales and commission</p>
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-slate-500">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Loading...
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Vendor</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Contact</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Sales (TZS)</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Commission</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {vendors.map((v) => {
                const sales = salesByVendor[v.id] ?? 0;
                const commission = (sales * Number(v.commission_rate ?? 0)) / 100;
                return (
                  <tr key={v.id}>
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-900">{v.business_name}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{v.contact_phone}</td>
                    <td className="px-5 py-3.5 text-right text-sm font-medium text-slate-900">{sales.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{Number(v.commission_rate)}% = TZS {Math.round(commission).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Link href="/orders" className="text-sm font-medium text-primary hover:text-primary-dark">Orders</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && vendors.length === 0 && (
          <div className="p-12 text-center text-slate-500">No approved vendors.</div>
        )}
      </div>
    </div>
  );
}
