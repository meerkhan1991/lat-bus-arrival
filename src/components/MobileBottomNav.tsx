import React from 'react';
import { NavTab } from './Navbar';
import { Clock, Map, Route, Compass, Bookmark } from 'lucide-react';

interface Props {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  bookmarkCount: number;
}

export const MobileBottomNav: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  bookmarkCount,
}) => {
  const tabs: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'arrivals', label: 'Arrivals', icon: Clock },
    { id: 'map', label: 'Live Map', icon: Map },
    { id: 'routes', label: 'Routes', icon: Route },
    { id: 'nearby', label: 'Nearby', icon: Compass },
    { id: 'bookmarks', label: 'Saved', icon: Bookmark },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 md:hidden shadow-lg">
      <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 transition-colors relative ${
                isActive ? 'text-emerald-600 font-bold' : 'text-slate-500 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {tab.id === 'bookmarks' && bookmarkCount > 0 && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-emerald-600 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                    {bookmarkCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight truncate max-w-full">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-600" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
