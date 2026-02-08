'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Tags,
  Upload,
  ClipboardList,
  Warehouse,
  ShoppingCart,
  Truck,
  RotateCcw,
  Users,
  CreditCard,
  Wallet,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

const nav = [
  { href: '/', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/products', label: 'Products', Icon: Package },
  { href: '/bulk-upload', label: 'Bulk upload', Icon: Upload },
  { href: '/categories', label: 'Categories', Icon: Tags },
  { href: '/inventory', label: 'Inventory', Icon: ClipboardList },
  { href: '/fulfillment-centers', label: 'Fulfillment', Icon: Warehouse },
  { href: '/orders', label: 'Orders', Icon: ShoppingCart },
  { href: '/shipments', label: 'Shipments', Icon: Truck },
  { href: '/returns', label: 'Returns', Icon: RotateCcw },
  { href: '/vendors', label: 'Vendors', Icon: Users },
  { href: '/payments', label: 'Payments', Icon: CreditCard },
  { href: '/payouts', label: 'Payouts', Icon: Wallet },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-white shadow-sm">
        <Link href="/" className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          <Image src="/logo.png" alt="WATS" width={36} height={36} className="shrink-0 rounded-lg" />
          <div>
            <span className="font-semibold text-slate-900">WATS</span>
            <span className="block text-xs text-slate-500">Admin</span>
          </div>
        </Link>
        <nav className="flex-1 overflow-auto p-3">
          {nav.map(({ href, label, Icon }) => {
            const isActive =
              pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <button
            onClick={async () => {
              await signOut();
              router.push('/login');
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut className="h-5 w-5 shrink-0" strokeWidth={2} />
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
    </div>
  );
}
