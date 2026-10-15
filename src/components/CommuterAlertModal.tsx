import React, { useState } from 'react';
import { LTAArrivalService, CommuterAlarm } from '../types/bus';
import { Bell, X, Clock, Check, Volume2 } from 'lucide-react';
import { playTransitChime } from '../utils/transitChime';

interface Props {
  service: LTAArrivalService;
  busStopCode: string;
  busStopName: string;
  onClose: () => void;
  onSaveAlarm: (alarm: CommuterAlarm) => void;
}

export const CommuterAlertModal: React.FC<Props> = ({
  service,
  busStopCode,
  busStopName,
  onClose,
  onSaveAlarm,
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(2);

  const handleTestChime = () => {
    playTransitChime();
  };

  const handleConfirm = () => {
    const alarm: CommuterAlarm = {
      id: `${busStopCode}-${service.ServiceNo}-${Date.now()}`,
      busStopCode,
      busStopName,
      serviceNo: service.ServiceNo,
      destinationName: service.NextBus?.DestinationName || 'Interchange',
      thresholdMinutes: selectedMinutes,
      triggered: false,
      createdAt: Date.now(),
    };
    playTransitChime();
    onSaveAlarm(alarm);
    onClose();
  };

  const options = [1, 2, 3, 5];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Set Arrival Alarm
              </h3>
              <p className="text-xs text-slate-500">
                Bus {service.ServiceNo} at {busStopName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Choose how many minutes before Bus <b>{service.ServiceNo}</b> arrives to trigger an audio chime and alert so you have time to walk to the bus stop.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">
              Notify me when bus is:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {options.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setSelectedMinutes(mins)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                    selectedMinutes === mins
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <span className="text-slate-600">Sample notification chime:</span>
            <button
              onClick={handleTestChime}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 shadow-xs"
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Test Tone</span>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors"
          >
            Set Alarm ({selectedMinutes}m)
          </button>
        </div>
      </div>
    </div>
  );
};
