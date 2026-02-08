'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
const SHIPMENT_STATUSES = ['pending', 'picked', 'packed', 'in_transit', 'delivered', 'failed'] as const;

export default function OrderDetail() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [order, setOrder] = useState<any>(null);
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [creatingShipment, setCreatingShipment] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      supabase.from('orders').select(`
        *,
        order_items(
          id, quantity, unit_price_tzs, total_tzs,
          products(id, name_sw, name_en)
        )
      `).eq('id', id).single(),
      supabase.from('shipments').select('id, status, tracking_number, carrier, created_at').eq('order_id', id).order('created_at', { ascending: false }),
    ]).then(([orderRes, shipRes]) => {
      if (!orderRes.error) setOrder(orderRes.data);
      if (!shipRes.error) setShipments(shipRes.data ?? []);
      setLoading(false);
    });
  }, [id]);

  const updateStatus = async (status: string) => {
    if (!id) return;
    setUpdating(true);
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    setUpdating(false);
    if (!error) setOrder((o: any) => (o ? { ...o, status } : o));
  };

  const createShipment = async () => {
    if (!id) return;
    setCreatingShipment(true);
    const { data, error } = await supabase.from('shipments').insert({ order_id: id, status: 'pending' }).select('id, status, tracking_number, carrier, created_at').single();
    setCreatingShipment(false);
    if (!error && data) {
      setShipments((prev) => [data, ...prev]);
    }
  };

  const updateShipmentStatus = async (shipmentId: string, status: string) => {
    const { error } = await supabase.from('shipments').update({ status }).eq('id', shipmentId);
    if (!error) setShipments((prev) => prev.map((s) => (s.id === shipmentId ? { ...s, status } : s)));
  };

  const canCreateShipment = order && ['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status) && shipments.length === 0;

  if (loading) return <div className="flex items-center justify-center gap-2 p-12 text-slate-500">Loading...</div>;
  if (!order) return <div className="p-12 text-slate-500">Order not found.</div>;

  return (
    <div>
      <Link href="/orders" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{order.order_number}</h1>
          <p className="mt-1 text-sm text-slate-500">Created {new Date(order.created_at).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">Status:</label>
          <select
            aria-label="Order status"
            value={order.status}
            onChange={(e) => updateStatus(e.target.value)}
            disabled={updating}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Summary</h2>
          <dl className="mt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="font-medium text-slate-900">TZS {Number(order.subtotal_tzs).toLocaleString()}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-slate-500">Shipping</dt>
              <dd className="font-medium text-slate-900">TZS {Number(order.shipping_tzs).toLocaleString()}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-slate-500">Tax</dt>
              <dd className="font-medium text-slate-900">TZS {Number(order.tax_tzs).toLocaleString()}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
              <dt className="font-medium text-slate-700">Total</dt>
              <dd className="font-semibold text-primary">TZS {Number(order.total_tzs).toLocaleString()}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Shipping address</h2>
          <pre className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
            {typeof order.shipping_address === 'object'
              ? JSON.stringify(order.shipping_address, null, 2)
              : order.shipping_address}
          </pre>
        </div>
      </div>
      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-200 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Items</h2>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Product</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500">Qty</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500">Unit price</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {(order.order_items ?? []).map((item: any) => (
              <tr key={item.id}>
                <td className="px-5 py-3 text-sm font-medium text-slate-900">
                  {item.products?.name_sw ?? item.products?.name_en ?? item.id}
                </td>
                <td className="px-5 py-3 text-right text-sm text-slate-600">{item.quantity}</td>
                <td className="px-5 py-3 text-right text-sm text-slate-600">TZS {Number(item.unit_price_tzs).toLocaleString()}</td>
                <td className="px-5 py-3 text-right text-sm font-medium text-slate-900">TZS {Number(item.total_tzs).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
            <Package className="h-4 w-4" /> Shipments
          </h2>
          {canCreateShipment && (
            <button
              type="button"
              onClick={createShipment}
              disabled={creatingShipment}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
            >
              <Plus className="h-4 w-4" /> Create shipment
            </button>
          )}
        </div>
        {shipments.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">No shipments yet.{canCreateShipment ? ' Use the button above to create one.' : ''}</p>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Tracking</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Created</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {shipments.map((s) => (
                <tr key={s.id}>
                  <td className="px-5 py-3">
                    <select
                      aria-label="Shipment status"
                      value={s.status}
                      onChange={(e) => updateShipmentStatus(s.id, e.target.value)}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700"
                    >
                      {SHIPMENT_STATUSES.map((st) => (
                        <option key={st} value={st}>{st.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">{s.tracking_number ?? '–'} {s.carrier && `(${s.carrier})`}</td>
                  <td className="px-5 py-3 text-sm text-slate-500">{new Date(s.created_at).toLocaleString()}</td>
                  <td className="px-5 py-3 text-right">
                    <Link href="/shipments" className="text-sm font-medium text-primary hover:text-primary-dark">View all</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
