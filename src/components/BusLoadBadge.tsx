import React from 'react';
import { BusLoad, BusDeckType } from '../types/bus';
import { Accessibility, Layers } from 'lucide-react';

interface Props {
  load: BusLoad;
  deckType?: BusDeckType;
  isWab?: boolean;
  showLabels?: boolean;
  compact?: boolean;
}

export const BusLoadBadge: React.FC<Props> = ({
  load,
  deckType,
  isWab = true,
  showLabels = false,
  compact = false,
}) => {
  // LTA Official Load specifications
  let colorBg = 'bg-emerald-50 text-emerald-800 border-emerald-300';
  let barColor = 'bg-emerald-500';
  let label = 'Seats Avail';
  let desc = 'Ample seating';

  if (load === 'SDA') {
    colorBg = 'bg-amber-50 text-amber-800 border-amber-300';
    barColor = 'bg-amber-500';
    label = 'Standing Avail';
    desc = 'Standing room';
  } else if (load === 'LSD') {
    colorBg = 'bg-rose-50 text-rose-800 border-rose-300';
    barColor = 'bg-rose-500';
    label = 'Limited Standing';
    desc = 'Crowded';
  }

  return (
    <div className="flex items-center gap-1.5 text-xs">
      {/* 3-bar LTA load indicator */}
      <div
        className="flex items-end gap-0.5 h-3.5 w-4"
        title={`Crowd Load: ${label} (${desc})`}
        aria-label={`Crowd Load: ${label}`}
      >
        <span
          className={`w-1 rounded-xs h-1.5 ${barColor}`}
        />
        <span
          className={`w-1 rounded-xs h-2.5 ${
            load === 'SDA' || load === 'LSD' ? barColor : 'bg-slate-200'
          }`}
        />
        <span
          className={`w-1 rounded-xs h-3.5 ${load === 'LSD' ? barColor : 'bg-slate-200'}`}
        />
      </div>

      {showLabels && (
        <span className="text-[11px] font-medium text-slate-600">
          {label}
        </span>
      )}

      {/* Deck Indicator */}
      {deckType && (
        <span
          className="text-[10px] font-mono font-semibold px-1 rounded bg-slate-100 text-slate-700 border border-slate-200"
          title={
            deckType === 'DD'
              ? 'Double Decker Bus'
              : deckType === 'BD'
              ? 'Bendy Bus'
              : 'Single Deck Bus'
          }
        >
          {deckType === 'DD' ? 'DD' : deckType === 'BD' ? 'Bendy' : 'SD'}
        </span>
      )}

      {/* WAB Accessible Indicator */}
      {isWab && (
        <span
          title="Wheelchair Accessible Bus (WAB)"
          aria-label="Wheelchair Accessible"
          className="text-slate-400"
        >
          <Accessibility className="w-3 h-3 text-sky-600" />
        </span>
      )}
    </div>
  );
};
