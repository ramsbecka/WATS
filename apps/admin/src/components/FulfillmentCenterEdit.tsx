'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Props = { id?: string };

export default function FulfillmentCenterEdit({ id: idProp }: Props = {}) {
  const params = useParams();
  const router = useRouter();
  const id = idProp ?? (params?.id as string | undefined);
  const isNew = id === 'new';
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    region: '',
    address: '',
    is_active: true,
  });

  useEffect(() => {
    if (isNew || !id) return;
    supabase
      .from('fulfillment_centers')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data)
          setForm({
            name: data.name ?? '',
            region: data.region ?? '',
            address: data.address ?? '',
            is_active: data.is_active ?? true,
          });
        setLoading(false);
      });
  }, [id, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: form.name, region: form.region, address: form.address, is_active: form.is_active };
      if (isNew) {
        const { error } = await supabase.from('fulfillment_centers').insert(payload);
        if (error) throw error;
        router.push('/fulfillment-centers');
      } else {
        const { error } = await supabase.from('fulfillment_centers').update(payload).eq('id', id);
        if (error) throw error;
        router.push('/fulfillment-centers');
      }
    } catch (e: any) {
      alert(e.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !isNew) return <div className="text-slate-500">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">{isNew ? 'New fulfillment center' : 'Edit fulfillment center'}</h1>
      <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
        <div>
          <label htmlFor="fc-name" className="mb-1.5 block text-sm font-medium text-slate-700">Name</label>
          <input
            id="fc-name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="fc-region" className="mb-1.5 block text-sm font-medium text-slate-700">Region</label>
          <input
            id="fc-region"
            value={form.region}
            onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="fc-address" className="mb-1.5 block text-sm font-medium text-slate-700">Address</label>
          <textarea
            id="fc-address"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            rows={3}
            required
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="fc-is_active"
            checked={form.is_active}
            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            className="rounded border-slate-300"
          />
          <label htmlFor="fc-is_active" className="text-sm text-slate-700">Active</label>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button type="button" onClick={() => router.back()} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
