'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package,
  ShoppingCart,
  Wallet,
  TrendingUp,
  ClipboardList,
  Users,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const LOW_STOCK_THRESHOLD = 5;
const cards = [
  { key: 'ordersToday', label: 'Orders today', to: '/orders', Icon: Package, color: 'bg-primary/10 text-primary' },
  { key: 'ordersTotal', label: 'Total orders', to: '/orders', Icon: ShoppingCart, color: 'bg-slate-100 text-slate-700' },
  { key: 'pendingReturns', label: 'Pending returns', to: '/returns', Icon: RotateCcw, color: 'bg-orange-50 text-orange-700' },
  { key: 'lowStock', label: 'Low stock (≤' + LOW_STOCK_THRESHOLD + ')', to: '/inventory', Icon: AlertTriangle, color: 'bg-amber-50 text-amber-700' },
  { key: 'revenueToday', label: 'Revenue today (TZS)', to: '/payments', Icon: Wallet, color: 'bg-emerald-50 text-emerald-700' },
  { key: 'revenueTotal', label: 'Total revenue (TZS)', to: '/payments', Icon: TrendingUp, color: 'bg-blue-50 text-blue-700' },
  { key: 'products', label: 'Products', to: '/products', Icon: ClipboardList, color: 'bg-violet-50 text-violet-700' },
  { key: 'vendors', label: 'Vendors', to: '/vendors', Icon: Users, color: 'bg-amber-50 text-amber-700' },
];

export default function Dashboard() {
  const [stats, setStats] = useState<Record<string, number | string>>({
    ordersToday: 0,
    ordersTotal: 0,
    pendingReturns: 0,
    lowStock: 0,
    revenueToday: 0,
    revenueTotal: 0,
    products: 0,
    vendors: 0,
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
    ]).then(([oToday, oAll, rToday, rAll, prods, vends]) => {
      const revToday = (rToday.data ?? []).reduce((s, r) => s + Number(r.total_tzs), 0);
      const revAll = (rAll.data ?? []).reduce((s, r) => s + Number(r.total_tzs), 0);
      setStats({
        ordersToday: oToday.count ?? 0,
        ordersTotal: oAll.count ?? 0,
        pendingReturns: 0,
        lowStock: 0,
        revenueToday: revToday.toLocaleString(),
        revenueTotal: revAll.toLocaleString(),
        products: prods.count ?? 0,
        vendors: vends.count ?? 0,
      });
      supabase.from('returns').select('id', { count: 'exact', head: true }).eq('status', 'requested').then(({ count }) => {
        setStats((prev) => ({ ...prev, pendingReturns: count ?? 0 }));
      });
      supabase.from('inventory').select('product_id').lte('quantity', LOW_STOCK_THRESHOLD).then(({ data }) => {
        const distinct = new Set((data ?? []).map((r: any) => r.product_id));
        setStats((prev) => ({ ...prev, lowStock: distinct.size }));
      });
    });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">Overview and key metrics</p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ key, label, to, Icon, color }) => (
          <Link
            key={key}
            href={to}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
          >
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
              <Icon className="h-5 w-5" strokeWidth={2} />
            </div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-1 text-xl font-semibold text-slate-900 group-hover:text-primary">
              {stats[key]}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
