import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BusStopData,
  BusArrivalResponse,
  LTAArrivalService,
  CommuterAlarm,
} from './types/bus';
import { SINGAPORE_BUS_STOPS } from './data/singaporeBusData';
import { LTABusService } from './services/ltaBusApi';
import { Navbar, NavTab } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { BusArrivalCard } from './components/BusArrivalCard';
import { LiveTransitMap } from './components/LiveTransitMap';
import { BusRouteInspector } from './components/BusRouteInspector';
import { NearbyStopsPanel } from './components/NearbyStopsPanel';
import { CommuterAlertModal } from './components/CommuterAlertModal';
import { BackendIntegrationModal } from './components/BackendIntegrationModal';
import { playTransitChime } from './utils/transitChime';
import {
  Search,
  RefreshCw,
  MapPin,
  Train,
  BellRing,
  X,
  Bookmark,
  Layers,
  Info,
  Clock,
  Compass,
} from 'lucide-react';

export default function App() {
  // Navigation & View Tab
  const [activeTab, setActiveTab] = useState<NavTab>('arrivals');

  // Selected Bus Stop
  const [currentStopCode, setCurrentStopCode] = useState<string>('09048'); // Default Opp Orchard Stn/ION
  const [selectedRouteService, setSelectedRouteService] = useState<string>('190');

  // Search
  const [searchQuery, setSearchQuery] = useState<string>('');

  // User simulated/real location coordinates
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: 1.30441,
    lng: 103.83226,
  });

  // Real-time Arrivals Data
  const [arrivalsData, setArrivalsData] = useState<BusArrivalResponse | null>(null);
  const [isLoadingArrivals, setIsLoadingArrivals] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Favorites / Bookmarks
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sg_bus_bookmarks');
      return saved ? JSON.parse(saved) : ['190', '36', '147'];
    } catch {
      return ['190', '36', '147'];
    }
  });

  // Commuter Alarms
  const [activeAlarms, setActiveAlarms] = useState<CommuterAlarm[]>([]);
  const [alarmModalService, setAlarmModalService] = useState<LTAArrivalService | null>(null);
  const [triggeredAlarmNotification, setTriggeredAlarmNotification] = useState<CommuterAlarm | null>(null);

  // Backend Integration Modal
  const [isBackendModalOpen, setIsBackendModalOpen] = useState<boolean>(false);

  // Fetch Arrivals
  const loadArrivals = useCallback(async (stopCode: string) => {
    setIsLoadingArrivals(true);
    try {
      const data = await LTABusService.getBusArrivals(stopCode);
      setArrivalsData(data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load arrivals:', err);
    } finally {
      setIsLoadingArrivals(false);
    }
  }, []);

  // Initial load & when stop changes
  useEffect(() => {
    loadArrivals(currentStopCode);
  }, [currentStopCode, loadArrivals]);

  // Periodic Refresh (every 20s)
  useEffect(() => {
    const refreshTimer = setInterval(() => {
      loadArrivals(currentStopCode);
    }, 20000);
    return () => clearInterval(refreshTimer);
  }, [currentStopCode, loadArrivals]);

  // Real-Time 1-Second Countdown Ticker & Alarm Monitor
  useEffect(() => {
    const ticker = setInterval(() => {
      setArrivalsData((prev) => {
        if (!prev) return null;
        const updatedServices = prev.Services.map((svc) => {
          const nextSec = Math.max(0, svc.NextBus.EstimatedArrivalSeconds - 1);
          const next2Sec = svc.NextBus2
            ? Math.max(0, svc.NextBus2.EstimatedArrivalSeconds - 1)
            : undefined;
          const next3Sec = svc.NextBus3
            ? Math.max(0, svc.NextBus3.EstimatedArrivalSeconds - 1)
            : undefined;

          // Check alarms
          activeAlarms.forEach((alarm) => {
            if (
              alarm.busStopCode === prev.BusStopCode &&
              alarm.serviceNo === svc.ServiceNo &&
              !alarm.triggered
            ) {
              const thresholdSec = alarm.thresholdMinutes * 60;
              if (nextSec <= thresholdSec) {
                // Alarm fires!
                playTransitChime();
                alarm.triggered = true;
                setTriggeredAlarmNotification({ ...alarm });
              }
            }
          });

          return {
            ...svc,
            NextBus: {
              ...svc.NextBus,
              EstimatedArrivalSeconds: nextSec,
            },
            NextBus2: svc.NextBus2 && next2Sec !== undefined
              ? { ...svc.NextBus2, EstimatedArrivalSeconds: next2Sec }
              : svc.NextBus2,
            NextBus3: svc.NextBus3 && next3Sec !== undefined
              ? { ...svc.NextBus3, EstimatedArrivalSeconds: next3Sec }
              : svc.NextBus3,
          };
        });

        return {
          ...prev,
          Services: updatedServices,
        };
      });
    }, 1000);

    return () => clearInterval(ticker);
  }, [activeAlarms]);

  // Save Bookmarks to LocalStorage
  const handleToggleBookmark = (serviceNo: string) => {
    setBookmarks((prev) => {
      const next = prev.includes(serviceNo)
        ? prev.filter((s) => s !== serviceNo)
        : [...prev, serviceNo];
      try {
        localStorage.setItem('sg_bus_bookmarks', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Add Alarm
  const handleSaveAlarm = (alarm: CommuterAlarm) => {
    setActiveAlarms((prev) => [...prev.filter((a) => a.id !== alarm.id), alarm]);
  };

  // Dismiss Alarm
  const handleDismissNotification = () => {
    setTriggeredAlarmNotification(null);
  };

  // Current bus stop object
  const currentStop = useMemo(() => {
    return (
      SINGAPORE_BUS_STOPS.find((s) => s.BusStopCode === currentStopCode) ||
      SINGAPORE_BUS_STOPS[0]
    );
  }, [currentStopCode]);

  // Search Results
  const searchResults = useMemo(() => {
    return LTABusService.searchBusStops(searchQuery);
  }, [searchQuery]);

  // Nearby Stops
  const nearbyStops = useMemo(() => {
    return LTABusService.getNearbyStops(userCoords.lat, userCoords.lng, 8);
  }, [userCoords]);

  // Filtered Services for Current Stop
  const displayedServices = useMemo(() => {
    if (!arrivalsData) return [];
    if (activeTab === 'bookmarks') {
      return arrivalsData.Services.filter((svc) => bookmarks.includes(svc.ServiceNo));
    }
    return arrivalsData.Services;
  }, [arrivalsData, activeTab, bookmarks]);

  // Handle View Route
  const handleViewRoute = (serviceNo: string) => {
    setSelectedRouteService(serviceNo);
    setActiveTab('routes');
  };

  // Handle Track on Map
  const handleTrackOnMap = (serviceNo: string) => {
    setSelectedRouteService(serviceNo);
    setActiveTab('map');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 pb-16 md:pb-0">
      {/* Universal 3-Zone Top Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenBackendModal={() => setIsBackendModalOpen(true)}
        bookmarkCount={bookmarks.length}
      />

      {/* Triggered Alarm Toast Banner */}
      {triggeredAlarmNotification && (
        <div className="bg-amber-500 text-slate-950 px-4 py-3 shadow-lg flex items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center shrink-0">
              <BellRing className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <p className="font-bold text-sm">
                Bus {triggeredAlarmNotification.serviceNo} is {triggeredAlarmNotification.thresholdMinutes} minute{triggeredAlarmNotification.thresholdMinutes > 1 ? 's' : ''} away!
              </p>
              <p className="text-xs text-slate-900 font-medium">
                Approaching {triggeredAlarmNotification.busStopName} ({triggeredAlarmNotification.busStopCode})
              </p>
            </div>
          </div>
          <button
            onClick={handleDismissNotification}
            className="p-1 rounded-lg hover:bg-amber-600 text-slate-950 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Responsive Grid Layout (1440px desktop balanced layout) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Search & Location Bar */}
        <section className="mb-6">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by 5-digit Stop Code (e.g. 09048), Road, Bus Service (e.g. 190), or Landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Instant Search Results Dropdown */}
          {searchQuery.trim().length > 0 && (
            <div className="mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl max-h-72 overflow-y-auto p-2 z-20 relative">
              <div className="text-[11px] font-semibold text-slate-400 px-3 py-1 uppercase tracking-wider">
                Matching Bus Stops ({searchResults.length})
              </div>
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  No matching Singapore bus stops found.
                </div>
              ) : (
                searchResults.map((stop) => (
                  <button
                    key={stop.BusStopCode}
                    onClick={() => {
                      setCurrentStopCode(stop.BusStopCode);
                      setSearchQuery('');
                      setActiveTab('arrivals');
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                          {stop.BusStopCode}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">
                          {stop.Description}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {stop.RoadName} {stop.MrtInterchange && `· ${stop.MrtInterchange}`}
                      </div>
                    </div>
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                      View
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </section>

        {/* Desktop 2-Column Split: Left Side Panel + Right Side Map / Route View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (Arrivals, Nearby, or Saved) - Span 6 or 7 on desktop */}
          <div className="lg:col-span-6 xl:col-span-7 space-y-4">
            {/* Bus Stop Information Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-slate-900 text-white tracking-wide">
                      {currentStop.BusStopCode}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {currentStop.RoadName}
                    </span>
                  </div>
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {currentStop.Description}
                  </h1>
                </div>

                <button
                  onClick={() => loadArrivals(currentStop.BusStopCode)}
                  disabled={isLoadingArrivals}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
                  title="Refresh arrivals now"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isLoadingArrivals ? 'animate-spin text-emerald-600' : ''}`}
                  />
                </button>
              </div>

              {currentStop.MrtInterchange && (
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-lg mb-3">
                  <Train className="w-3.5 h-3.5 text-emerald-600" />
                  <span>MRT Transfer: {currentStop.MrtInterchange}</span>
                </div>
              )}

              {/* Commuter Status Bar & LTA Legend */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Updated: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span>·</span>
                  <span className="text-emerald-700 font-semibold">Live GPS Active</span>
                </div>

                {/* Micro LTA Load legend */}
                <div className="flex items-center gap-3 text-[11px]">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Seats</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Standing</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Full</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Switcher based on Active Tab */}
            {activeTab === 'nearby' ? (
              <NearbyStopsPanel
                nearbyStops={nearbyStops}
                selectedStopCode={currentStopCode}
                onSelectStop={(code) => {
                  setCurrentStopCode(code);
                  setActiveTab('arrivals');
                }}
                onViewOnMap={(code) => {
                  setCurrentStopCode(code);
                  setActiveTab('map');
                }}
              />
            ) : activeTab === 'routes' ? (
              <div className="h-[600px]">
                <BusRouteInspector
                  initialServiceNo={selectedRouteService}
                  onSelectStop={(code) => {
                    setCurrentStopCode(code);
                    setActiveTab('arrivals');
                  }}
                  onTrackVehicleOnMap={(svc) => {
                    setSelectedRouteService(svc);
                    setActiveTab('map');
                  }}
                />
              </div>
            ) : (
              /* Arrivals List */
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {activeTab === 'bookmarks'
                      ? `Favorite Services (${displayedServices.length})`
                      : `Bus Services at Stop (${displayedServices.length})`}
                  </h2>

                  {activeTab === 'bookmarks' && (
                    <button
                      onClick={() => setActiveTab('arrivals')}
                      className="text-xs font-medium text-emerald-700 hover:underline"
                    >
                      Show all services
                    </button>
                  )}
                </div>

                {displayedServices.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                    <Bookmark className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <h3 className="font-bold text-slate-700 text-sm">
                      {activeTab === 'bookmarks' ? 'No Bookmarked Services' : 'No Buses Currently Operating'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {activeTab === 'bookmarks'
                        ? 'Tap the bookmark icon on any bus card to pin it here.'
                        : 'Please check operating hours or choose another bus stop.'}
                    </p>
                  </div>
                ) : (
                  displayedServices.map((service) => (
                    <BusArrivalCard
                      key={service.ServiceNo}
                      service={service}
                      busStopCode={currentStop.BusStopCode}
                      busStopName={currentStop.Description}
                      isBookmarked={bookmarks.includes(service.ServiceNo)}
                      hasActiveAlarm={activeAlarms.some(
                        (a) =>
                          a.busStopCode === currentStop.BusStopCode &&
                          a.serviceNo === service.ServiceNo &&
                          !a.triggered
                      )}
                      onToggleBookmark={handleToggleBookmark}
                      onOpenAlarmModal={(svc) => setAlarmModalService(svc)}
                      onViewRoute={handleViewRoute}
                      onTrackOnMap={handleTrackOnMap}
                    />
                  ))
                )}
              </div>
            )}
          </div>

          {/* Right Column: Interactive Live Transit Map (Always visible on desktop, or switched on mobile) */}
          <div className="lg:col-span-6 xl:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden h-[500px] lg:h-[720px] flex flex-col">
              <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-sm text-slate-900">
                    Live Singapore Transit Radar
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-500">
                  Click any pin for arrivals
                </span>
              </div>

              <div className="flex-1 relative">
                <LiveTransitMap
                  selectedStopCode={currentStopCode}
                  selectedServiceNo={selectedRouteService}
                  onSelectStop={(code) => setCurrentStopCode(code)}
                  userCoords={userCoords}
                  onUpdateUserCoords={setUserCoords}
                />
              </div>
            </div>

            {/* Quick Commuter Info Strip */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-xs text-slate-600 space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>Singapore Transit Tips</span>
                <span className="text-emerald-700 font-mono">LTA DataMall v2</span>
              </div>
              <p className="leading-relaxed">
                Bus arrivals reflect real-time GPS telemetry from SBS Transit, SMRT, Tower Transit, and Go-Ahead Singapore fleets. Set arrival alarms to be notified before your bus arrives at the stop.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        bookmarkCount={bookmarks.length}
      />

      {/* Commuter Arrival Alarm Modal */}
      {alarmModalService && (
        <CommuterAlertModal
          service={alarmModalService}
          busStopCode={currentStop.BusStopCode}
          busStopName={currentStop.Description}
          onClose={() => setAlarmModalService(null)}
          onSaveAlarm={handleSaveAlarm}
        />
      )}

      {/* Backend Integration Setup Modal */}
      <BackendIntegrationModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
      />
    </div>
  );
}
