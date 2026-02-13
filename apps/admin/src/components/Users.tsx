'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users as UsersIcon, Mail, Phone } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const loadUsers = () => {
    setLoading(true);
    let q = supabase
      .from('profile')
      .select('id, display_name, email, phone, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(200);
    
    if (search.trim()) {
      q = q.or(`display_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%`);
    }
    
    q.then(({ data, error }) => {
      if (!error) setUsers(data ?? []);
      setLoading(false);
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Users</h1>
          <p className="mt-1 text-sm text-slate-500">Watumiaji wote wa mfumo</p>
        </div>
      </div>
      <div className="mt-4">
        <input
          type="search"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm w-64"
          aria-label="Search users"
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
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Email</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Phone</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-2 font-medium text-slate-900">
                      <UsersIcon className="h-4 w-4 text-slate-400" />
                      {u.display_name || 'No name'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">
                    {u.email ? (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {u.email}
                      </span>
                    ) : (
                      <span className="text-slate-400">–</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">
                    {u.phone ? (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {u.phone}
                      </span>
                    ) : (
                      <span className="text-slate-400">–</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && users.length === 0 && (
          <div className="p-12 text-center text-slate-500">No users found.</div>
        )}
      </div>
    </div>
  );
}
