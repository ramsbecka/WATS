'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RotateCcw, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const RETURN_STATUSES = ['requested', 'approved', 'received', 'refunded', 'rejected'] as const;

export default function Returns() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingRefundId, setEditingRefundId] = useState<string | null>(null);
  const [editingRefundValue, setEditingRefundValue] = useState('');

  const load = () => {
    setLoading(true);
    supabase
      .from('returns')
      .select(`
        id, order_id, status, reason, refund_amount_tzs, created_at,
        orders(order_number, total_tzs)
      `)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (!error) setRows(data ?? []);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    const { error } = await supabase.from('returns').update({ status }).eq('id', id);
    setUpdating(null);
    if (!error) setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const saveRefund = async (id: string, value: string) => {
    const num = value.trim() === '' ? null : Number(value.replace(/\D/g, ''));
    const { error } = await supabase.from('returns').update({ refund_amount_tzs: num }).eq('id', id);
    if (!error) setRows((prev) => prev.map((r) => (r.id === id ? { ...r, refund_amount_tzs: num } : r)));
    setEditingRefundId(null);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Returns</h1>
      <p className="mt-1 text-sm text-slate-500">Return requests and refunds</p>
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
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Reason</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Refund</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-3.5">
                    <Link href={`/orders/${r.order_id}`} className="font-medium text-primary hover:text-primary-dark">
                      {(r.orders as any)?.order_number ?? r.order_id}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <select
                      aria-label="Return status"
                      value={r.status}
                      onChange={(e) => updateStatus(r.id, e.target.value)}
                      disabled={updating === r.id}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700"
                    >
                      {RETURN_STATUSES.map((s) => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </td>
                  <td className="max-w-[200px] truncate px-5 py-3.5 text-sm text-slate-600" title={r.reason ?? ''}>{r.reason ?? '–'}</td>
                  <td className="px-5 py-3.5">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      aria-label="Refund amount TZS"
                      className="w-28 rounded border border-slate-300 px-2 py-1 text-sm"
                      value={editingRefundId === r.id ? editingRefundValue : (r.refund_amount_tzs != null ? String(r.refund_amount_tzs) : '')}
                      onChange={(e) => { setEditingRefundId(r.id); setEditingRefundValue(e.target.value); }}
                      onFocus={() => { setEditingRefundId(r.id); setEditingRefundValue(r.refund_amount_tzs != null ? String(r.refund_amount_tzs) : ''); }}
                      onBlur={() => { if (editingRefundId === r.id) saveRefund(r.id, editingRefundValue); }}
                      placeholder="TZS"
                    />
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/orders/${r.order_id}`} className="inline-flex items-center text-slate-400 hover:text-primary">
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && rows.length === 0 && (
          <div className="p-12 text-center text-slate-500">No returns.</div>
        )}
      </div>
    </div>
  );
}
