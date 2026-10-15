import React from 'react';
import { Bus, Server, Clock } from 'lucide-react';

export type NavTab = 'arrivals' | 'map' | 'routes' | 'nearby' | 'bookmarks';

interface Props {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenBackendModal: () => void;
  bookmarkCount: number;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  onOpenBackendModal,
  bookmarkCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Single text element wordmark with icon */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <Bus className="w-4 h-4 text-emerald-400" />
          </div>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onSelectTab('arrivals');
            }}
            className="text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap"
          >
            SG Bus Arrival
          </a>
        </div>

        {/* Zone 2: 4-5 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
          <button
            onClick={() => onSelectTab('arrivals')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'arrivals'
                ? 'text-slate-900 border-slate-900'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            Arrivals
          </button>

          <button
            onClick={() => onSelectTab('map')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'map'
                ? 'text-slate-900 border-slate-900'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            Live Map
          </button>

          <button
            onClick={() => onSelectTab('routes')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'routes'
                ? 'text-slate-900 border-slate-900'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            Routes
          </button>

          <button
            onClick={() => onSelectTab('nearby')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'nearby'
                ? 'text-slate-900 border-slate-900'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            Nearby Stops
          </button>

          <button
            onClick={() => onSelectTab('bookmarks')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'bookmarks'
                ? 'text-slate-900 border-slate-900'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <span>Favorites</span>
            {bookmarkCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                {bookmarkCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenBackendModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap shrink-0 border border-slate-200/80"
          >
            <Server className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Backend Specs</span>
            <span className="sm:hidden">Backend</span>
          </button>
        </div>
      </div>
    </header>
  );
};
