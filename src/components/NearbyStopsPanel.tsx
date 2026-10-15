import React from 'react';
import { BusStopData } from '../types/bus';
import { MapPin, Navigation, Train, ArrowRight } from 'lucide-react';

interface Props {
  nearbyStops: BusStopData[];
  selectedStopCode: string;
  onSelectStop: (code: string) => void;
  onViewOnMap: (code: string) => void;
}

export const NearbyStopsPanel: React.FC<Props> = ({
  nearbyStops,
  selectedStopCode,
  onSelectStop,
  onViewOnMap,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Nearby Bus Stops
          </h2>
          <p className="text-xs text-slate-500">
            Ranked by walking distance from your location
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5">
        {nearbyStops.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No nearby bus stops found.
          </div>
        ) : (
          nearbyStops.map((stop) => {
            const isSelected = stop.BusStopCode === selectedStopCode;
            const dist = stop.DistanceMeters ?? 0;
            const walkMins = Math.max(1, Math.round(dist / 75)); // ~75 meters/min walking speed

            return (
              <div
                key={stop.BusStopCode}
                onClick={() => onSelectStop(stop.BusStopCode)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                      {stop.BusStopCode}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm truncate">
                      {stop.Description}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span className="truncate">{stop.RoadName}</span>
                    <span>·</span>
                    <span className="font-semibold text-emerald-700 whitespace-nowrap">
                      {dist < 1000 ? `${dist}m` : `${(dist / 1000).toFixed(1)}km`} (~{walkMins} min walk)
                    </span>
                  </div>

                  {stop.MrtInterchange && (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-800 font-medium">
                      <Train className="w-3 h-3 text-emerald-700 shrink-0" />
                      <span className="truncate">{stop.MrtInterchange}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar mt-2">
                    <span className="text-[10px] text-slate-400 font-medium uppercase shrink-0 mr-1">
                      Buses:
                    </span>
                    {stop.Services.slice(0, 7).map((svc) => (
                      <span
                        key={svc}
                        className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 text-[10px] font-bold font-mono shrink-0"
                      >
                        {svc}
                      </span>
                    ))}
                    {stop.Services.length > 7 && (
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        +{stop.Services.length - 7} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewOnMap(stop.BusStopCode);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition-colors"
                    title="Focus on map"
                  >
                    <MapPin className="w-4 h-4" />
                  </button>
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
