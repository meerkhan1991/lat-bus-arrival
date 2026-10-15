import React from 'react';
import { LTAArrivalService, LTANextBus } from '../types/bus';
import { BusLoadBadge } from './BusLoadBadge';
import { Bell, BellRing, Bookmark, MapPin, Navigation, Bus, Clock } from 'lucide-react';

interface Props {
  service: LTAArrivalService;
  busStopCode: string;
  busStopName: string;
  isBookmarked: boolean;
  hasActiveAlarm: boolean;
  onToggleBookmark: (serviceNo: string) => void;
  onOpenAlarmModal: (service: LTAArrivalService) => void;
  onViewRoute: (serviceNo: string) => void;
  onTrackOnMap?: (serviceNo: string) => void;
}

function formatCountdown(nextBus?: LTANextBus): { text: string; subtext?: string; isArriving: boolean } {
  if (!nextBus || !nextBus.EstimatedArrival) {
    return { text: 'No Info', isArriving: false };
  }

  const sec = Math.max(0, nextBus.EstimatedArrivalSeconds);
  if (sec <= 45) {
    return { text: 'Arr', subtext: 'Approaching stop', isArriving: true };
  }

  const minutes = Math.floor(sec / 60);
  const remainingSec = sec % 60;
  return {
    text: `${minutes} min`,
    subtext: `${minutes}m ${remainingSec.toString().padStart(2, '0')}s`,
    isArriving: false,
  };
}

export const BusArrivalCard: React.FC<Props> = ({
  service,
  isBookmarked,
  hasActiveAlarm,
  onToggleBookmark,
  onOpenAlarmModal,
  onViewRoute,
  onTrackOnMap,
}) => {
  const next1 = formatCountdown(service.NextBus);
  const next2 = formatCountdown(service.NextBus2);
  const next3 = formatCountdown(service.NextBus3);

  // Operator color palette
  const operatorColors: Record<string, { bg: string; text: string; label: string }> = {
    SBST: { bg: 'bg-purple-100 text-purple-800', text: 'text-purple-700', label: 'SBS Transit' },
    SMRT: { bg: 'bg-rose-100 text-rose-800', text: 'text-rose-700', label: 'SMRT' },
    TTS: { bg: 'bg-emerald-100 text-emerald-800', text: 'text-emerald-700', label: 'Tower Transit' },
    GAS: { bg: 'bg-amber-100 text-amber-800', text: 'text-amber-700', label: 'Go-Ahead' },
  };

  const opInfo = operatorColors[service.Operator] || {
    bg: 'bg-slate-100 text-slate-800',
    text: 'text-slate-700',
    label: service.Operator,
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all p-4">
      {/* Top row: Service number, operator, destination, and quick actions */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="inline-flex items-center justify-center min-w-[54px] px-2.5 py-1.5 rounded-xl bg-slate-900 text-white font-extrabold text-lg tracking-tight tabular-nums shadow-xs">
              {service.ServiceNo}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${opInfo.bg}`}>
                {opInfo.label}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500 font-medium">
                to {service.NextBus?.DestinationName || 'Interchange'}
              </span>
            </div>

            {service.NextBus?.DistanceMeters !== undefined && (
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-medium">
                <Navigation className="w-3 h-3 text-slate-400" />
                <span>
                  {service.NextBus.DistanceMeters < 1000
                    ? `${service.NextBus.DistanceMeters}m away`
                    : `${(service.NextBus.DistanceMeters / 1000).toFixed(1)}km away`}
                </span>
                <span>·</span>
                <span>
                  {service.NextBus.StopsAway === 0
                    ? 'Next Stop'
                    : `${service.NextBus.StopsAway} stops away`}
                </span>
                {service.NextBus.SpeedKmH && (
                  <>
                    <span>·</span>
                    <span className="tabular-nums">{service.NextBus.SpeedKmH} km/h</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onOpenAlarmModal(service)}
            className={`p-2 rounded-lg text-xs transition-colors ${
              hasActiveAlarm
                ? 'bg-amber-100 text-amber-800'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
            title={hasActiveAlarm ? 'Alarm active' : 'Set Arrival Alarm'}
            aria-label="Set Arrival Alarm"
          >
            {hasActiveAlarm ? <BellRing className="w-4 h-4 text-amber-600 animate-bounce" /> : <Bell className="w-4 h-4" />}
          </button>

          <button
            onClick={() => onToggleBookmark(service.ServiceNo)}
            className={`p-2 rounded-lg text-xs transition-colors ${
              isBookmarked
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark service'}
            aria-label="Bookmark bus service"
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-emerald-600 text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3 Arrival Predictions Grid */}
      <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
        {/* Next Bus 1 */}
        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-white shadow-xs border border-slate-200/60 text-center">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
            Next Bus
          </span>
          <div className="flex items-center gap-1 my-0.5">
            <span
              className={`text-lg font-bold tabular-nums tracking-tight ${
                next1.isArriving
                  ? 'text-emerald-600 font-extrabold animate-pulse'
                  : 'text-slate-900'
              }`}
            >
              {next1.text}
            </span>
          </div>

          <div className="mt-1">
            <BusLoadBadge
              load={service.NextBus.Load}
              deckType={service.NextBus.Type}
              isWab={service.NextBus.Feature === 'WAB'}
            />
          </div>

          {next1.subtext && !next1.isArriving && (
            <span className="text-[10px] font-mono text-slate-400 mt-1 tabular-nums">
              {next1.subtext}
            </span>
          )}
        </div>

        {/* Next Bus 2 */}
        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/70 border border-slate-200/40 text-center">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
            2nd Bus
          </span>
          <span className="text-base font-bold text-slate-800 tabular-nums tracking-tight my-0.5">
            {next2.text}
          </span>
          {service.NextBus2 && (
            <div className="mt-1">
              <BusLoadBadge
                load={service.NextBus2.Load}
                deckType={service.NextBus2.Type}
                isWab={service.NextBus2.Feature === 'WAB'}
              />
            </div>
          )}
        </div>

        {/* Next Bus 3 */}
        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/70 border border-slate-200/40 text-center">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
            3rd Bus
          </span>
          <span className="text-base font-bold text-slate-800 tabular-nums tracking-tight my-0.5">
            {next3.text}
          </span>
          {service.NextBus3 && (
            <div className="mt-1">
              <BusLoadBadge
                load={service.NextBus3.Load}
                deckType={service.NextBus3.Type}
                isWab={service.NextBus3.Feature === 'WAB'}
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar with Route Viewer and Live Map actions */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
        <button
          onClick={() => onViewRoute(service.ServiceNo)}
          className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-emerald-700 transition-colors"
        >
          <Bus className="w-3.5 h-3.5 text-slate-400" />
          <span>View Route & Stops</span>
        </button>

        {onTrackOnMap && (
          <button
            onClick={() => onTrackOnMap(service.ServiceNo)}
            className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Track Live on Map</span>
          </button>
        )}
      </div>
    </div>
  );
};
