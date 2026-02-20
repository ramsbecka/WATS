'use client';
import { useEffect, useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const FUNCTIONS_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '') + '/functions/v1';

export default function BulkUpload() {
  const [vendors, setVendors] = useState<{ id: string; business_name: string }[]>([]);
  const [vendorId, setVendorId] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number; ids: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('vendors')
      .select('id, business_name')
      .order('business_name')
      .then(({ data }) => setVendors(data ?? []));
  }, []);

  const handleSubmit = async () => {
    setError(null);
    setResult(null);
    if (!vendorId.trim()) {
      setError('Please select a store.');
      return;
    }
    let products: any[];
    try {
      const parsed = JSON.parse(jsonInput.trim());
      products = Array.isArray(parsed) ? parsed : parsed?.products ?? [];
    } catch {
      setError('Invalid JSON. Enter a products array or { "products": [...] }.');
      return;
    }
    if (products.length === 0) {
      setError('Product list is empty.');
      return;
    }
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      setError('You are logged out. Sign in again.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${FUNCTIONS_URL}/vendor-products-bulk-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ vendor_id: vendorId, products }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `HTTP ${res.status}`);
        setLoading(false);
        return;
      }
      setResult({ created: data.created ?? 0, ids: data.ids ?? [] });
    } catch (e: any) {
      setError(e.message || 'Network error');
    }
    setLoading(false);
  };

  const example = `[
  { "name_en": "Product 1", "price_tzs": 15000, "sku": "SKU-001" },
  { "name_en": "Product 2", "price_tzs": 25000, "category_id": "uuid-optional", "images": ["https://..."] }
]`;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bulk upload products</h1>
      <p className="mt-1 text-sm text-slate-500">Pakia bidhaa nyingi kwa duka moja (JSON)</p>
      <div className="mt-6 max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="vendor" className="block text-sm font-medium text-slate-700">Duka</label>
          <select
            id="vendor"
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
          >
            <option value="">Select store</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>{v.business_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="json" className="block text-sm font-medium text-slate-700">JSON (products array or {"{ \"products\": [...] }"})</label>
          <textarea
            id="json"
            rows={12}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder={example}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-800"
          />
        </div>
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {result && (
          <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Success: {result.created} products created. IDs: {result.ids.slice(0, 5).join(', ')}{result.ids.length > 5 ? '…' : ''}
          </div>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
        >
          <Upload className="h-4 w-4" />
          {loading ? 'Uploading…' : 'Upload'}
        </button>
      </div>
    </div>
  );
}
