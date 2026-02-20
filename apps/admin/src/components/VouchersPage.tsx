'use client';

import { useState } from 'react';
import { Ticket, List, Settings } from 'lucide-react';
import Vouchers from './Vouchers';
import VoucherSettings from './VoucherSettings';

const TABS = [
  { id: 'list', label: 'Voucher list', Icon: List },
  { id: 'settings', label: 'Settings', Icon: Settings },
] as const;

export default function VouchersPage() {
  const [tab, setTab] = useState<string>('list');

  return (
    <div>
      <div className="mb-6 flex items-center gap-2 border-b border-slate-200/90">
        <div className="flex items-center gap-2 text-slate-800">
          <Ticket className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold tracking-tight">Vouchers</span>
        </div>
        <nav className="ml-6 flex gap-0.5" aria-label="Voucher tabs">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 rounded-t-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === id
                  ? 'border-slate-200/90 border-b-white bg-white text-primary shadow-card -mb-px'
                  : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>
      {tab === 'list' && <Vouchers hideTitle />}
      {tab === 'settings' && <VoucherSettings hideTitle />}
    </div>
  );
}
