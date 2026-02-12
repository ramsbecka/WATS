'use client';
import { useEffect, useState } from 'react';
import { Users, Gift, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ReferralCodes() {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadCodes();
  }, [search]);

  const loadCodes = () => {
    setLoading(true);
    let q = supabase
      .from('referral_codes')
      .select(`
        id, code, referral_bonus_points, referred_bonus_points, total_referrals, is_active, created_at,
        profile(id, display_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(200);
    
    if (search.trim()) {
      q = q.or(`code.ilike.%${search.trim()}%,profile.display_name.ilike.%${search.trim()}%`);
    }
    
    q.then(({ data, error }) => {
      if (!error) setCodes(data ?? []);
      setLoading(false);
    });
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('referral_codes')
      .update({ is_active: !currentStatus })
      .eq('id', id);
    
    if (!error) {
      setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: !currentStatus } : c)));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Referral Codes</h1>
          <p className="mt-1 text-sm text-slate-500">Manage referral codes and track referrals</p>
        </div>
      </div>
      <div className="mt-4">
        <input
          type="search"
          placeholder="Search by code or user name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm w-64"
          aria-label="Search referral codes"
        />
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
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Total Referrals</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Referrer Bonus</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Referred Bonus</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {codes.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-3.5">
                    <span className="font-mono font-medium text-slate-900">{c.code}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">
                    {c.profile?.display_name || c.profile?.email || 'Unknown'}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-900">
                      <TrendingUp className="h-4 w-4" />
                      {c.total_referrals || 0}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm text-slate-600">
                    {c.referral_bonus_points || 0} pts
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm text-slate-600">
                    {c.referred_bonus_points || 0} pts
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleActive(c.id, c.is_active)}
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                        c.is_active
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {c.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && codes.length === 0 && (
          <div className="p-12 text-center text-slate-500">No referral codes found.</div>
        )}
      </div>
    </div>
  );
}
