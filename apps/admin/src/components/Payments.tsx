'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const STATUS_OPTIONS = ['pending', 'initiated', 'completed', 'failed', 'refunded', 'cancelled'];

export default function Payments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [refunding, setRefunding] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    let q = supabase
      .from('payments')
      .select(`
        id, order_id, provider, status, amount_tzs, provider_reference, provider_callback, created_at,
        orders(order_number)
      `)
      .order('created_at', { ascending: false })
      .limit(100);
    if (statusFilter) q = q.eq('status', statusFilter);
    q.then(({ data, error }) => {
      if (!error) setPayments(data ?? []);
      setLoading(false);
    });
  }, [statusFilter]);

  const handleRefund = async (paymentId: string, orderId: string) => {
    if (!confirm('Are you sure you want to refund this payment?')) return;
    setRefunding(paymentId);
    try {
      // Update payment status to refunded
      const { error: payError } = await supabase
        .from('payments')
        .update({ status: 'refunded', updated_at: new Date().toISOString() })
        .eq('id', paymentId);
      
      if (payError) throw payError;

      // Update order status to cancelled
      await supabase
        .from('orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', orderId);

      // Create return record if doesn't exist
      const { data: existingReturn } = await supabase
        .from('returns')
        .select('id')
        .eq('order_id', orderId)
        .maybeSingle();
      
      if (!existingReturn) {
        const { data: order } = await supabase
          .from('orders')
          .select('total_tzs')
          .eq('id', orderId)
          .single();
        
        await supabase.from('returns').insert({
          order_id: orderId,
          status: 'refunded',
          reason: 'Admin refund',
          refund_amount_tzs: order?.total_tzs || 0,
        });
      }

      // Reload payments
      setStatusFilter(statusFilter);
    } catch (error: any) {
      alert('Refund failed: ' + (error.message || 'Unknown error'));
    } finally {
      setRefunding(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payments</h1>
          <p className="mt-1 text-sm text-slate-500">Payment monitoring</p>
        </div>
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
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
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Provider</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Reference</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Amount (TZS)</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-3.5">
                    <Link href={`/orders/${p.order_id}`} className="font-medium text-primary hover:text-primary-dark">
                      {(p.orders as any)?.order_number ?? p.order_id}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{p.provider}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      p.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                      p.status === 'failed' ? 'bg-red-50 text-red-700' :
                      p.status === 'refunded' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">
                    {p.provider_reference ? (
                      <span className="font-mono text-xs">{p.provider_reference}</span>
                    ) : (
                      <span className="text-slate-400">–</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm font-medium text-slate-900">{Number(p.amount_tzs).toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{new Date(p.created_at).toLocaleString()}</td>
                  <td className="px-5 py-3.5">
                    {p.status === 'completed' && (
                      <button
                        onClick={() => handleRefund(p.id, p.order_id)}
                        disabled={refunding === p.id}
                        className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        {refunding === p.id ? 'Processing...' : 'Refund'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && payments.length === 0 && (
          <div className="p-12 text-center text-slate-500">No payments.</div>
        )}
      </div>
    </div>
  );
}
