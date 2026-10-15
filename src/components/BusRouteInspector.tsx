import React, { useState } from 'react';
import { BusRouteData, ActiveBusVehicle } from '../types/bus';
import { POPULAR_BUS_ROUTES } from '../data/singaporeBusData';
import { LTABusService } from '../services/ltaBusApi';
import { ArrowRight, Bus, Clock, MapPin, Train, RefreshCw } from 'lucide-react';

interface Props {
  initialServiceNo?: string;
  onSelectStop: (busStopCode: string) => void;
  onTrackVehicleOnMap?: (serviceNo: string) => void;
}

export const BusRouteInspector: React.FC<Props> = ({
  initialServiceNo = '190',
  onSelectStop,
  onTrackVehicleOnMap,
}) => {
  const [selectedService, setSelectedService] = useState<string>(initialServiceNo);
  const route = POPULAR_BUS_ROUTES[selectedService] || POPULAR_BUS_ROUTES['190'];
  const activeBuses = LTABusService.getLiveVehicles(selectedService);

  const availableServices = Object.keys(POPULAR_BUS_ROUTES);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Route Selector Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold px-3 py-1 bg-slate-900 text-white rounded-xl font-mono">
              {route.ServiceNo}
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Route & Live Stops
              </h2>
              <p className="text-xs text-slate-500">
                Operated by {route.Operator} · Direction {route.Direction}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-500 font-medium">Service:</label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 shadow-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {availableServices.map((svc) => (
                <option key={svc} value={svc}>
                  Bus {svc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Origin -> Destination Banner */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
          <span className="truncate">{route.OriginName}</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate text-emerald-800">{route.DestinationName}</span>
        </div>

        {/* Operating hours & Frequency badges */}
        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 bg-white px-2.5 py-1.5 rounded-lg border border-slate-100">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Hours: {route.FirstBusWeekday} - {route.LastBusWeekday}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 bg-white px-2.5 py-1.5 rounded-lg border border-slate-100">
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Frequency: {route.FrequencyPeak}</span>
          </div>
        </div>
      </div>

      {/* Vertical Route Sequence Diagram */}
      <div className="flex-1 overflow-y-auto p-4 space-y-0 relative">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
          Stop Sequence ({route.Stops.length} stops)
        </div>

        <div className="relative pl-6">
          {/* Vertical Metro Line */}
          <div className="absolute left-[11px] top-3 bottom-6 w-1 bg-emerald-500 rounded-full" />

          {route.Stops.map((stop, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === route.Stops.length - 1;

            // Check if any active bus is currently approaching this stop
            const busApproaching = activeBuses.find(
              (b) => b.nextStopCode === stop.BusStopCode
            );

            return (
              <div
                key={stop.BusStopCode}
                className="relative pb-6 last:pb-2 group cursor-pointer"
                onClick={() => onSelectStop(stop.BusStopCode)}
              >
                {/* Node Dot */}
                <div
                  className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 transition-transform group-hover:scale-125 ${
                    isFirst || isLast
                      ? 'bg-slate-900 border-white ring-2 ring-slate-900 shadow-sm'
                      : 'bg-white border-emerald-600 shadow-xs'
                  }`}
                />

                {/* Approaching bus badge floating next to node */}
                {busApproaching && (
                  <div className="mb-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-md animate-pulse">
                    <Bus className="w-3 h-3" />
                    <span>Bus {busApproaching.serviceNo} approaching ({busApproaching.speedKmH} km/h)</span>
                  </div>
                )}

                {/* Stop Card */}
                <div className="flex items-start justify-between gap-3 p-2.5 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50/80 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-slate-500">
                        #{stop.StopSequence}
                      </span>
                      <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {stop.Description}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{stop.RoadName}</span>
                      <span>·</span>
                      <span className="font-mono font-medium">{stop.BusStopCode}</span>
                      {stop.DistanceKm > 0 && (
                        <>
                          <span>·</span>
                          <span className="tabular-nums">{stop.DistanceKm} km</span>
                        </>
                      )}
                    </div>

                    {stop.MrtTransfer && (
                      <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        <Train className="w-3 h-3 text-emerald-700" />
                        <span>{stop.MrtTransfer}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectStop(stop.BusStopCode);
                    }}
                    className="shrink-0 text-xs font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    Arrivals
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
