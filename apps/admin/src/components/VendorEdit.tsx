'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Props = { id?: string };

export default function VendorEdit({ id: idProp }: Props = {}) {
  const params = useParams();
  const router = useRouter();
  const id = idProp ?? (params?.id as string | undefined);
  const isNew = id === 'new';
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    business_name: '',
    business_reg_no: '',
    contact_phone: '',
    commission_rate: '10',
    is_approved: true,
  });

  useEffect(() => {
    if (isNew || !id) return;
    supabase
      .from('vendors')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data)
          setForm({
            business_name: data.business_name ?? '',
            business_reg_no: data.business_reg_no ?? '',
            contact_phone: data.contact_phone ?? '',
            commission_rate: String(data.commission_rate ?? 10),
            is_approved: data.is_approved ?? true,
          });
        setLoading(false);
      });
  }, [id, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        business_name: form.business_name,
        business_reg_no: form.business_reg_no || null,
        contact_phone: form.contact_phone,
        commission_rate: Number(form.commission_rate) || 10,
        is_approved: form.is_approved,
      };
      if (isNew) {
        const { error } = await supabase.from('vendors').insert(payload);
        if (error) throw error;
        router.push('/vendors');
      } else {
        const { error } = await supabase.from('vendors').update(payload).eq('id', id);
        if (error) throw error;
        router.push('/vendors');
      }
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Failed to save';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !isNew) return <div className="text-slate-500">Loading...</div>;

  return (
    <div>
      <Link href="/vendors" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to Stores
      </Link>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">{isNew ? 'Add store' : 'Edit store'}</h1>
      <p className="mt-1 text-sm text-slate-500">Admin can add/edit stores; you add products after following the store owner.</p>
      <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
        <div>
          <label htmlFor="v-business" className="mb-1.5 block text-sm font-medium text-slate-700">Business name</label>
          <input
            id="v-business"
            value={form.business_name}
            onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="v-reg" className="mb-1.5 block text-sm font-medium text-slate-700">Registration number (optional)</label>
          <input
            id="v-reg"
            value={form.business_reg_no}
            onChange={(e) => setForm((f) => ({ ...f, business_reg_no: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="v-phone" className="mb-1.5 block text-sm font-medium text-slate-700">Contact phone</label>
          <input
            id="v-phone"
            value={form.contact_phone}
            onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="v-commission" className="mb-1.5 block text-sm font-medium text-slate-700">Commission rate (%)</label>
          <input
            id="v-commission"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={form.commission_rate}
            onChange={(e) => setForm((f) => ({ ...f, commission_rate: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="v-approved"
            type="checkbox"
            checked={form.is_approved}
            onChange={(e) => setForm((f) => ({ ...f, is_approved: e.target.checked }))}
            className="rounded border-slate-300"
          />
          <label htmlFor="v-approved" className="text-sm font-medium text-slate-700">Store cannot appear in reports until approved</label>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50">
            {saving ? 'Saving…' : isNew ? 'Add store' : 'Save'}
          </button>
          <Link href="/vendors" className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
