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
  UserCircle,
  CreditCard,
  Wallet,
  LogOut,
  Ticket,
  UserPlus,
  Image as ImageIcon,
  MessageCircle,
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
  { href: '/vendors', label: 'Stores', Icon: Users },
  { href: '/users', label: 'Users', Icon: UserCircle },
  { href: '/payments', label: 'Payments', Icon: CreditCard },
  { href: '/payouts', label: 'Payouts', Icon: Wallet },
  { href: '/vouchers', label: 'Vouchers', Icon: Ticket },
  { href: '/content', label: 'Content', Icon: ImageIcon },
  { href: '/referral-codes', label: 'Referral Codes', Icon: UserPlus },
  { href: '/support-chat', label: 'Live chat', Icon: MessageCircle },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-100/80">
      <aside className="flex w-64 flex-col border-r border-slate-200/80 bg-white shadow-sidebar">
        <Link
          href="/"
          className="flex h-14 items-center gap-3 border-b border-slate-100 px-5 transition-colors hover:bg-slate-50/50"
        >
          <Image
            src="/logo.png"
            alt="WATS"
            width={32}
            height={32}
            className="shrink-0 rounded-lg ring-1 ring-slate-200/80"
          />
          <div>
            <span className="font-semibold tracking-tight text-slate-900">WATS</span>
            <span className="block text-[11px] font-medium uppercase tracking-wider text-slate-400">Admin</span>
          </div>
        </Link>
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2.5">
          {nav.map(({ href, label, Icon }) => {
            const isActive =
              pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-2.5">
          <button
            onClick={async () => {
              await signOut();
              router.push('/login');
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="mx-auto max-w-7xl animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
