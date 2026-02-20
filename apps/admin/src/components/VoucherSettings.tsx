'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function VoucherSettings({ hideTitle }: { hideTitle?: boolean }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    is_enabled: false,
    discount_percentage: 5.00,
    min_order_amount_tzs: 0,
    voucher_validity_days: 30,
    max_usage_per_voucher: 1,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('voucher_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (!error && data) {
      setSettingsId(data.id);
      setSettings({
        is_enabled: data.is_enabled ?? false,
        discount_percentage: Number(data.discount_percentage) ?? 5.00,
        min_order_amount_tzs: Number(data.min_order_amount_tzs) ?? 0,
        voucher_validity_days: Number(data.voucher_validity_days) ?? 30,
        max_usage_per_voucher: Number(data.max_usage_per_voucher) ?? 1,
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      ...settings,
      updated_at: new Date().toISOString(),
    };
    
    let error;
    if (settingsId) {
      // Update existing
      const result = await supabase
        .from('voucher_settings')
        .update(payload)
        .eq('id', settingsId)
        .select()
        .single();
      error = result.error;
    } else {
      // Insert new
      const result = await supabase
        .from('voucher_settings')
        .insert(payload)
        .select()
        .single();
      error = result.error;
      if (!error && result.data) {
        setSettingsId(result.data.id);
      }
    }

    setSaving(false);
    if (error) {
      alert('Failed to save settings: ' + error.message);
    } else {
      alert('Settings saved successfully!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-12 text-slate-500">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Loading...
      </div>
    );
  }

  return (
    <div>
      {!hideTitle && (
        <>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Voucher Settings</h1>
          <p className="mt-1 text-sm text-slate-500">Configure automatic voucher generation system</p>
        </>
      )}
      <div className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${hideTitle ? 'mt-4' : 'mt-8'}`}>
        <div className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="enable_vouchers" className="text-sm font-medium text-slate-700">Enable Voucher System</label>
              <p className="mt-0.5 text-xs text-slate-500">
                When enabled, customers will automatically receive vouchers for each product they purchase
              </p>
            </div>
            <label htmlFor="enable_vouchers" className="relative inline-flex cursor-pointer items-center">
              <input
                id="enable_vouchers"
                type="checkbox"
                checked={settings.is_enabled}
                onChange={(e) => setSettings((s) => ({ ...s, is_enabled: e.target.checked }))}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
            </label>
          </div>

          {settings.is_enabled && (
            <>
              {/* Discount Percentage */}
              <div>
                <label htmlFor="discount_percentage" className="block text-sm font-medium text-slate-700">
                  Discount Percentage (%)
                </label>
                <p className="mt-0.5 text-xs text-slate-500">
                  Percentage discount applied by each voucher (0-100)
                </p>
                <input
                  id="discount_percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={settings.discount_percentage}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      discount_percentage: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)),
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              {/* Minimum Order Amount */}
              <div>
                <label htmlFor="min_order_amount" className="block text-sm font-medium text-slate-700">
                  Minimum Order Amount (TZS)
                </label>
                <p className="mt-0.5 text-xs text-slate-500">
                  Minimum order amount required to use a voucher (0 = no minimum)
                </p>
                <input
                  id="min_order_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={settings.min_order_amount_tzs}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      min_order_amount_tzs: Math.max(0, parseFloat(e.target.value) || 0),
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              {/* Validity Days */}
              <div>
                <label htmlFor="validity_days" className="block text-sm font-medium text-slate-700">
                  Voucher Validity (Days)
                </label>
                <p className="mt-0.5 text-xs text-slate-500">
                  Number of days vouchers remain valid after generation
                </p>
                <input
                  id="validity_days"
                  type="number"
                  min="1"
                  value={settings.voucher_validity_days}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      voucher_validity_days: Math.max(1, parseInt(e.target.value) || 30),
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              {/* Max Usage */}
              <div>
                <label htmlFor="max_usage" className="block text-sm font-medium text-slate-700">
                  Max Usage Per Voucher
                </label>
                <p className="mt-0.5 text-xs text-slate-500">
                  Maximum number of times a single voucher can be used
                </p>
                <input
                  id="max_usage"
                  type="number"
                  min="1"
                  value={settings.max_usage_per_voucher}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      max_usage_per_voucher: Math.max(1, parseInt(e.target.value) || 1),
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="text-sm font-medium text-blue-900">How it works:</h3>
        <ul className="mt-2 space-y-1 text-xs text-blue-800">
          <li>• When enabled, vouchers are automatically generated after each order is delivered/completed</li>
          <li>• One voucher is created for each unique product in the order</li>
          <li>• Vouchers can be used on future purchases</li>
          <li>• You can disable the system at any time to stop generating new vouchers</li>
        </ul>
      </div>
    </div>
  );
}
