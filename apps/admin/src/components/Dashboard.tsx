'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package,
  ShoppingCart,
  Wallet,
  ClipboardList,
  Users,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const LOW_STOCK_THRESHOLD = 5;
const cards = [
  { key: 'orders', label: 'Orders', to: '/orders', Icon: ShoppingCart, color: 'bg-primary/10 text-primary', sub: 'ordersSub' },
  { key: 'products', label: 'Products', to: '/products', Icon: Package, color: 'bg-violet-50 text-violet-700' },
  { key: 'vendors', label: 'Stores', to: '/vendors', Icon: Users, color: 'bg-amber-50 text-amber-700' },
  { key: 'users', label: 'Users', to: '/users', Icon: Users, color: 'bg-indigo-50 text-indigo-700' },
  { key: 'payments', label: 'Payments', to: '/payments', Icon: Wallet, color: 'bg-emerald-50 text-emerald-700', sub: 'paymentsSub' },
  { key: 'pendingReturns', label: 'Pending returns', to: '/returns', Icon: RotateCcw, color: 'bg-orange-50 text-orange-700' },
  { key: 'lowStock', label: 'Low stock', to: '/inventory', Icon: AlertTriangle, color: 'bg-amber-50 text-amber-700', subLabel: 'lowStockSub' },
];

export default function Dashboard() {
  const [stats, setStats] = useState<Record<string, number | string>>({
    ordersToday: 0,
    ordersTotal: 0,
    users: 0,
    pendingReturns: 0,
    lowStock: 0,
    revenueToday: 0,
    revenueTotal: 0,
    products: 0,
    vendors: 0,
        ordersSub: '',
        paymentsSub: '',
        lowStockSub: '', // e.g. "≤5 units"
  });

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    Promise.all([
      supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('total_tzs').gte('created_at', today).in('status', ['confirmed', 'processing', 'shipped', 'delivered']),
      supabase.from('orders').select('total_tzs').in('status', ['confirmed', 'processing', 'shipped', 'delivered']),
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('vendors').select('id', { count: 'exact', head: true }),
      supabase.from('profile').select('id', { count: 'exact', head: true }),
    ]).then(([oToday, oAll, rToday, rAll, prods, vends, users]) => {
      const revToday = (rToday.data ?? []).reduce((s, r) => s + Number(r.total_tzs), 0);
      const revAll = (rAll.data ?? []).reduce((s, r) => s + Number(r.total_tzs), 0);
      setStats({
        ordersToday: oToday.count ?? 0,
        ordersTotal: oAll.count ?? 0,
        users: users.count ?? 0,
        pendingReturns: 0,
        lowStock: 0,
        revenueToday: revToday.toLocaleString(),
        revenueTotal: revAll.toLocaleString(),
        products: prods.count ?? 0,
        vendors: vends.count ?? 0,
        ordersSub: `${oToday.count ?? 0} today · ${oAll.count ?? 0} total`,
        paymentsSub: `${revToday.toLocaleString()} today · ${revAll.toLocaleString()} total`,
        lowStockSub: '',
      });
      supabase.from('returns').select('id', { count: 'exact', head: true }).eq('status', 'requested').then(({ count }) => {
        setStats((prev) => ({ ...prev, pendingReturns: count ?? 0 }));
      });
      supabase.from('inventory').select('product_id').lte('quantity', LOW_STOCK_THRESHOLD).then(({ data }) => {
        const distinct = new Set((data ?? []).map((r: any) => r.product_id));
        setStats((prev) => ({ ...prev, lowStock: distinct.size, lowStockSub: `≤${LOW_STOCK_THRESHOLD} units` }));
      });
    });
  }, []);

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Overview and key metrics</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map(({ key, label, to, Icon, color, sub, subLabel }) => (
          <Link
            key={key}
            href={to}
            className="group relative overflow-hidden rounded-panel border border-slate-200/90 bg-white p-5 shadow-card transition-all duration-200 hover:border-primary/30 hover:shadow-card-hover"
          >
            <div
              className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${color} transition-transform duration-200 group-hover:scale-105`}
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
            </div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-primary">
              {sub && stats[sub] ? String(stats[sub]) : stats[key]}
            </p>
            {subLabel && stats[subLabel] && (
              <p className="mt-1 text-xs text-slate-500">{stats[subLabel]}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
