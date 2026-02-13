'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Ticket, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const STATUS_FILTERS = ['all', 'available', 'used', 'expired'] as const;

export default function Vouchers() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadVouchers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, search]);

  const loadVouchers = () => {
    setLoading(true);
    let q = supabase
      .from('vouchers')
      .select(`
        id, code, discount_percentage, min_order_amount_tzs, is_used, usage_count, max_usage,
        valid_from, valid_until, created_at,
        profile(id, display_name, email),
        orders(order_number),
        products(id, name_en)
      `)
      .order('created_at', { ascending: false })
      .limit(200);
    
    if (statusFilter === 'available') {
      q = q.eq('is_used', false).gte('valid_until', new Date().toISOString());
    } else if (statusFilter === 'used') {
      q = q.eq('is_used', true);
    } else if (statusFilter === 'expired') {
      q = q.eq('is_used', false).lt('valid_until', new Date().toISOString());
    }
    
    if (search.trim()) {
      q = q.or(`code.ilike.%${search.trim()}%,profile.display_name.ilike.%${search.trim()}%`);
    }
    
    q.then(({ data, error }) => {
      if (!error) setVouchers(data ?? []);
      setLoading(false);
    });
  };

  const getStatus = (voucher: any) => {
    if (voucher.is_used || voucher.usage_count >= voucher.max_usage) {
      return { label: 'Used', color: 'bg-slate-100 text-slate-600', icon: CheckCircle };
    }
    if (new Date(voucher.valid_until) < new Date()) {
      return { label: 'Expired', color: 'bg-red-50 text-red-700', icon: XCircle };
    }
    return { label: 'Available', color: 'bg-emerald-50 text-emerald-700', icon: Clock };
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Vouchers</h1>
          <p className="mt-1 text-sm text-slate-500">All vouchers in the system</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search by code or user name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm w-64"
          aria-label="Search vouchers"
        />
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
        >
          <option value="all">All statuses</option>
          <option value="available">Available</option>
          <option value="used">Used</option>
          <option value="expired">Expired</option>
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
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Code</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">User</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Product</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Discount</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Valid Until</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Usage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {vouchers.map((v) => {
                const status = getStatus(v);
                const StatusIcon = status.icon;
                return (
                  <tr key={v.id}>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 font-mono font-medium text-slate-900">
                        <Ticket className="h-4 w-4 text-primary" />
                        {v.code}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">
                      {v.profile?.display_name || v.profile?.email || 'Unknown'}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">
                      {v.products ? (
                        <Link href={`/products/${v.products.id}`} className="text-primary hover:underline">
                          {v.products.name_en || 'N/A'}
                        </Link>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-900">
                      {Number(v.discount_percentage)}%
                      {v.min_order_amount_tzs > 0 && (
                        <span className="ml-1 text-xs text-slate-500">
                          (min {Number(v.min_order_amount_tzs).toLocaleString()} TZS)
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">
                      {new Date(v.valid_until).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">
                      {v.usage_count} / {v.max_usage}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && vouchers.length === 0 && (
          <div className="p-12 text-center text-slate-500">No vouchers found.</div>
        )}
      </div>
    </div>
  );
}
