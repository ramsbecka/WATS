'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ImageIcon, RectangleHorizontal, ImagePlus } from 'lucide-react';
import Banners from './Banners';
import SplashImages from './SplashImages';

const TABS = [
  { id: 'banners', label: 'Banners', Icon: RectangleHorizontal },
  { id: 'splash', label: 'Splash Images', Icon: ImagePlus },
] as const;

export default function ContentPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [tab, setTab] = useState<string>(tabParam === 'splash' ? 'splash' : 'banners');

  useEffect(() => {
    if (tabParam === 'splash') setTab('splash');
    else if (tabParam === 'banners') setTab('banners');
  }, [tabParam]);

  return (
    <div>
      <div className="mb-6 flex items-center gap-2 border-b border-slate-200/90">
        <div className="flex items-center gap-2 text-slate-800">
          <ImageIcon className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold tracking-tight">Content</span>
        </div>
        <nav className="ml-6 flex gap-0.5" aria-label="Content tabs">
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
      {tab === 'banners' && <Banners hideTitle />}
      {tab === 'splash' && <SplashImages hideTitle />}
    </div>
  );
}
