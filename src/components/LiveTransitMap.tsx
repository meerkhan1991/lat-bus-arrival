import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { BusStopData, ActiveBusVehicle } from '../types/bus';
import { SINGAPORE_BUS_STOPS, POPULAR_BUS_ROUTES } from '../data/singaporeBusData';
import { LTABusService } from '../services/ltaBusApi';
import { Navigation, Compass, Layers, Crosshair, Bus, LocateFixed } from 'lucide-react';

interface Props {
  selectedStopCode?: string;
  selectedServiceNo?: string;
  onSelectStop: (stopCode: string) => void;
  userCoords: { lat: number; lng: number };
  onUpdateUserCoords: (coords: { lat: number; lng: number }) => void;
}

export const LiveTransitMap: React.FC<Props> = ({
  selectedStopCode,
  selectedServiceNo,
  onSelectStop,
  userCoords,
  onUpdateUserCoords,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const stopMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const busVehiclesLayerRef = useRef<L.LayerGroup | null>(null);
  const routePolylineLayerRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [activeVehicles, setActiveVehicles] = useState<ActiveBusVehicle[]>([]);
  const [filterService, setFilterService] = useState<string>(selectedServiceNo || '');
  const [isLocating, setIsLocating] = useState(false);

  // Sync selectedServiceNo prop
  useEffect(() => {
    if (selectedServiceNo) {
      setFilterService(selectedServiceNo);
    }
  }, [selectedServiceNo]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center on Singapore
    const initialLat = userCoords.lat || 1.30441;
    const initialLng = userCoords.lng || 103.83226;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false,
    });

    // Clean modern CartoDB Voyager tiles (crisp, high-contrast, free & reliable)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Layer groups for dynamic markers
    stopMarkersLayerRef.current = L.layerGroup().addTo(map);
    busVehiclesLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update User Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userCoords.lat, userCoords.lng]);
    } else {
      const userHtml = `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full bg-blue-500/20 animate-ping"></div>
          <div class="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md"></div>
        </div>
      `;
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: userHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      }).addTo(map);
    }
  }, [userCoords]);

  // Render Bus Stops
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = stopMarkersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    SINGAPORE_BUS_STOPS.forEach((stop) => {
      const isSelected = stop.BusStopCode === selectedStopCode;

      const stopHtml = `
        <div class="group cursor-pointer flex flex-col items-center">
          <div class="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono tracking-tight shadow-md transition-transform transform ${
            isSelected
              ? 'bg-emerald-600 text-white scale-125 ring-2 ring-emerald-300 ring-offset-1'
              : 'bg-white text-slate-800 border border-slate-300 hover:scale-110'
          }">
            ${stop.BusStopCode}
          </div>
          <div class="w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-emerald-600' : 'bg-slate-700'} border border-white shadow-xs -mt-1"></div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-bus-stop-icon',
        html: stopHtml,
        iconSize: [50, 30],
        iconAnchor: [25, 25],
      });

      const marker = L.marker([stop.Latitude, stop.Longitude], {
        icon,
        title: `${stop.Description} (${stop.BusStopCode})`,
      });

      // Popup
      const popupContent = `
        <div class="p-2 text-xs font-sans min-w-[180px]">
          <div class="font-bold text-slate-900 text-sm mb-0.5">${stop.Description}</div>
          <div class="text-slate-500 text-[11px] mb-1.5">${stop.RoadName} · <span class="font-mono font-semibold">${stop.BusStopCode}</span></div>
          ${stop.MrtInterchange ? `<div class="mb-2 text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">${stop.MrtInterchange}</div>` : ''}
          <div class="text-[11px] text-slate-600 font-semibold mb-1">Services: ${stop.Services.join(', ')}</div>
          <button id="btn-select-${stop.BusStopCode}" class="w-full mt-2 py-1 px-2 text-center text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800">
            View Live Arrivals
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-select-${stop.BusStopCode}`);
        if (btn) {
          btn.onclick = () => {
            onSelectStop(stop.BusStopCode);
            marker.closePopup();
          };
        }
      });

      marker.on('click', () => {
        onSelectStop(stop.BusStopCode);
      });

      layer.addLayer(marker);
    });
  }, [selectedStopCode, onSelectStop]);

  // Center on Selected Stop
  useEffect(() => {
    if (!selectedStopCode || !mapInstanceRef.current) return;
    const stop = SINGAPORE_BUS_STOPS.find((s) => s.BusStopCode === selectedStopCode);
    if (stop) {
      mapInstanceRef.current.setView([stop.Latitude, stop.Longitude], 16, {
        animate: true,
      });
    }
  }, [selectedStopCode]);

  // Draw Route Polyline if service is active
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routePolylineLayerRef.current) {
      map.removeLayer(routePolylineLayerRef.current);
      routePolylineLayerRef.current = null;
    }

    if (filterService) {
      const route = POPULAR_BUS_ROUTES[filterService];
      if (route && route.Stops && route.Stops.length > 1) {
        const latLngs: [number, number][] = route.Stops.map((s) => [s.Latitude, s.Longitude]);
        const polyline = L.polyline(latLngs, {
          color: '#059669', // Emerald 600
          weight: 4,
          opacity: 0.85,
          dashArray: '6, 8',
        }).addTo(map);

        routePolylineLayerRef.current = polyline;
      }
    }
  }, [filterService]);

  // Poll & Animate Live Bus Vehicles
  useEffect(() => {
    const updateVehicles = () => {
      const vehicles = LTABusService.getLiveVehicles(filterService || undefined);
      setActiveVehicles(vehicles);

      const map = mapInstanceRef.current;
      const layer = busVehiclesLayerRef.current;
      if (!map || !layer) return;

      layer.clearLayers();

      vehicles.forEach((veh) => {
        // Load color ring
        let loadColor = '#10b981'; // green
        if (veh.load === 'SDA') loadColor = '#f59e0b'; // amber
        if (veh.load === 'LSD') loadColor = '#ef4444'; // red

        const vehHtml = `
          <div class="cursor-pointer group flex flex-col items-center">
            <div class="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-900 text-white shadow-lg border-2 transition-transform group-hover:scale-110" style="border-color: ${loadColor}">
              <span class="text-xs font-black tracking-tight">${veh.serviceNo}</span>
              ${veh.deckType === 'DD' ? '<span class="text-[9px] px-1 bg-white/20 rounded font-bold">DD</span>' : ''}
              <div class="w-1.5 h-1.5 rounded-full" style="background-color: ${loadColor}"></div>
            </div>
            <div class="w-2 h-2 bg-slate-900 transform rotate-45 -mt-1 shadow-xs"></div>
          </div>
        `;

        const icon = L.divIcon({
          className: 'custom-bus-vehicle-icon',
          html: vehHtml,
          iconSize: [60, 36],
          iconAnchor: [30, 36],
        });

        const busMarker = L.marker([veh.latitude, veh.longitude], {
          icon,
          zIndexOffset: 500,
        });

        const popupContent = `
          <div class="p-2 text-xs font-sans">
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="text-base font-extrabold text-slate-900">Bus ${veh.serviceNo}</span>
              <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">${veh.deckType === 'DD' ? 'Double Decker' : 'Single Deck'}</span>
            </div>
            <div class="text-slate-600 mb-1">To: <span class="font-medium text-slate-800">${veh.destinationName}</span></div>
            <div class="text-slate-500 mb-1">Approaching: <span class="font-medium text-slate-700">${veh.nextStopName}</span></div>
            <div class="flex items-center gap-2 text-[11px] text-slate-500 mt-2 pt-1 border-t border-slate-100">
              <span>Speed: <b>${veh.speedKmH} km/h</b></span>
              <span>·</span>
              <span>Load: <b style="color: ${loadColor}">${veh.load === 'SEA' ? 'Seats Avail' : veh.load === 'SDA' ? 'Standing Avail' : 'Crowded'}</b></span>
            </div>
          </div>
        `;

        busMarker.bindPopup(popupContent);
        layer.addLayer(busMarker);
      });
    };

    updateVehicles();
    const timer = setInterval(updateVehicles, 3000); // 3-second live GPS polling simulation
    return () => clearInterval(timer);
  }, [filterService]);

  // Handle GPS Locate Me
  const handleLocateMe = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          onUpdateUserCoords(coords);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([coords.lat, coords.lng], 16, { animate: true });
          }
        },
        () => {
          setIsLocating(false);
          // Fallback to Orchard Rd
          const orchard = { lat: 1.30441, lng: 103.83226 };
          onUpdateUserCoords(orchard);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([orchard.lat, orchard.lng], 16, { animate: true });
          }
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setIsLocating(false);
    }
  };

  // Singapore Preset Transport Nodes
  const PRESET_NODES = [
    { label: 'Orchard Rd', coords: { lat: 1.30441, lng: 103.83226 } },
    { label: 'Marina Bay / MBS', coords: { lat: 1.28389, lng: 103.85918 } },
    { label: 'Bugis / Victoria', coords: { lat: 1.29685, lng: 103.85312 } },
    { label: 'HarbourFront / VivoCity', coords: { lat: 1.26498, lng: 103.82194 } },
    { label: 'Changi Airport', coords: { lat: 1.35512, lng: 103.98921 } },
    { label: 'Jurong East', coords: { lat: 1.33315, lng: 103.74239 } },
    { label: 'Woodlands', coords: { lat: 1.43679, lng: 103.78651 } },
  ];

  return (
    <div className="relative w-full h-full min-h-[400px] flex flex-col bg-slate-100 overflow-hidden">
      {/* Map Control Bar Overlay */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Service Filter dropdown */}
        <div className="pointer-events-auto flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200">
          <Bus className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-semibold text-slate-700">Filter Bus:</span>
          <select
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            className="text-xs font-bold text-slate-900 bg-transparent outline-none cursor-pointer"
          >
            <option value="">All Services</option>
            <option value="190">190 (Bt Panjang - Chinatown)</option>
            <option value="36">36 (Changi Airport - Orchard)</option>
            <option value="147">147 (Clementi - Hougang)</option>
            <option value="65">65 (Tampines - HarbourFront)</option>
            <option value="10">10 (Tampines - Kent Ridge)</option>
            <option value="106">106 (Jurong East - MBS)</option>
            <option value="960">960 (Woodlands - Marina Centre)</option>
          </select>
        </div>

        {/* Live Status indicator */}
        <div className="pointer-events-auto flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200 text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-semibold text-slate-800">
            {activeVehicles.length} Live Buses Tracked
          </span>
        </div>
      </div>

      {/* Preset location chips */}
      <div className="absolute bottom-4 left-3 right-16 z-10 flex items-center gap-1.5 overflow-x-auto no-scrollbar pointer-events-auto py-1">
        {PRESET_NODES.map((preset) => (
          <button
            key={preset.label}
            onClick={() => {
              onUpdateUserCoords(preset.coords);
              if (mapInstanceRef.current) {
                mapInstanceRef.current.setView([preset.coords.lat, preset.coords.lng], 15, {
                  animate: true,
                });
              }
            }}
            className="px-2.5 py-1 text-xs font-medium bg-white/90 backdrop-blur-md text-slate-700 hover:text-emerald-700 rounded-lg shadow-sm border border-slate-200/80 whitespace-nowrap shrink-0 transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Locate Me Floating Action Button */}
      <button
        onClick={handleLocateMe}
        disabled={isLocating}
        title="Locate my current position"
        className="absolute bottom-4 right-3 z-10 w-11 h-11 bg-white hover:bg-slate-50 text-slate-800 rounded-xl shadow-md border border-slate-200 flex items-center justify-center pointer-events-auto transition-transform active:scale-95"
      >
        <LocateFixed className={`w-5 h-5 ${isLocating ? 'animate-spin text-emerald-600' : 'text-slate-700'}`} />
      </button>

      {/* The Leaflet Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
