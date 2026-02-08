'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const SHIPMENT_STATUSES = ['pending', 'picked', 'packed', 'in_transit', 'delivered', 'failed'] as const;

export default function Shipments() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTracking, setEditTracking] = useState('');
  const [editCarrier, setEditCarrier] = useState('');

  const load = () => {
    setLoading(true);
    supabase
      .from('shipments')
      .select(`
        id, order_id, status, tracking_number, carrier, created_at,
        orders(order_number)
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
    const { error } = await supabase.from('shipments').update({ status }).eq('id', id);
    setUpdating(null);
    if (!error) setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const startEdit = (r: any) => {
    setEditingId(r.id);
    setEditTracking(r.tracking_number ?? '');
    setEditCarrier(r.carrier ?? '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTracking('');
    setEditCarrier('');
  };

  const saveTrackingCarrier = async (id: string) => {
    const { error } = await supabase
      .from('shipments')
      .update({ tracking_number: editTracking || null, carrier: editCarrier || null })
      .eq('id', id);
    if (!error) setRows((prev) => prev.map((r) => (r.id === id ? { ...r, tracking_number: editTracking || null, carrier: editCarrier || null } : r)));
    cancelEdit();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Shipments</h1>
      <p className="mt-1 text-sm text-slate-500">Fulfillment and delivery</p>
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
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Tracking</th>
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
                      aria-label="Shipment status"
                      value={r.status}
                      onChange={(e) => updateStatus(r.id, e.target.value)}
                      disabled={updating === r.id}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700"
                    >
                      {SHIPMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3.5">
                    {editingId === r.id ? (
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          placeholder="Tracking number"
                          value={editTracking}
                          onChange={(e) => setEditTracking(e.target.value)}
                          className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Carrier"
                          value={editCarrier}
                          onChange={(e) => setEditCarrier(e.target.value)}
                          className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                        />
                        <div className="flex gap-2">
                          <button type="button" onClick={() => saveTrackingCarrier(r.id)} className="text-sm font-medium text-primary hover:underline">Save</button>
                          <button type="button" onClick={cancelEdit} className="text-sm text-slate-500 hover:underline">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500">
                        {r.tracking_number ?? '–'} {r.carrier && `(${r.carrier})`}
                        <button type="button" onClick={() => startEdit(r)} className="ml-2 text-primary hover:underline">Edit</button>
                      </span>
                    )}
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
          <div className="p-12 text-center text-slate-500">No shipments.</div>
        )}
      </div>
    </div>
  );
}
