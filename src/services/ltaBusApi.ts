import {
  BusArrivalResponse,
  LTAArrivalService,
  LTANextBus,
  BusStopData,
  BusRouteData,
  ActiveBusVehicle,
  BusLoad,
  BusDeckType,
  BusOperator,
} from '../types/bus';
import { SINGAPORE_BUS_STOPS, POPULAR_BUS_ROUTES } from '../data/singaporeBusData';

// Configuration for when backend is connected
export const LTA_API_CONFIG = {
  // If backend endpoint is provided, the service switches from simulated data to live backend fetch
  backendUrl: import.meta.env.VITE_LTA_BACKEND_URL || '',
  accountKey: import.meta.env.VITE_LTA_ACCOUNT_KEY || '',
  useLiveBackend: false, // Set to true when backend proxy is available
};

// Calculate Haversine distance in meters
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Generate realistic simulated NextBus based on service and stop
function generateSimulatedNextBus(
  serviceNo: string,
  stop: BusStopData,
  tier: 1 | 2 | 3,
  nowMs: number
): LTANextBus {
  // Use a pseudo-random hash based on serviceNo, stopCode, and time bucket to ensure realistic deterministic ticking
  const timeSeed = Math.floor(nowMs / 1000);
  const hash = Math.abs(
    (serviceNo.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 31 +
      parseInt(stop.BusStopCode, 10)) ^
      (tier * 73)
  );

  // Interval in seconds
  let baseWaitSec = 0;
  if (tier === 1) {
    // 30s to 360s (0.5 to 6 minutes)
    baseWaitSec = 45 + (hash % 320);
  } else if (tier === 2) {
    // 7 to 15 mins
    baseWaitSec = 420 + (hash % 480);
  } else {
    // 16 to 26 mins
    baseWaitSec = 960 + (hash % 600);
  }

  // Ticking countdown
  const elapsedOffset = timeSeed % baseWaitSec;
  const secondsRemaining = Math.max(0, baseWaitSec - elapsedOffset);

  const arrivalDate = new Date(nowMs + secondsRemaining * 1000);

  // Operator
  const route = POPULAR_BUS_ROUTES[serviceNo];
  const destName = route ? route.DestinationName : 'Interchange';
  const destCode = route ? route.DestinationCode : '00000';

  // Loads: mostly Seats Available (SEA), sometimes Standing Available (SDA), rarely Limited Standing (LSD)
  const loadRoll = (hash + tier * 5) % 10;
  let load: BusLoad = 'SEA';
  if (loadRoll >= 8) load = 'LSD';
  else if (loadRoll >= 5) load = 'SDA';

  // Deck Types: DD is common in SG for high demand trunks (190, 65, 147, 10), SD for feeders, BD for some SMRT
  let deckType: BusDeckType = 'SD';
  if (['190', '147', '65', '10', '106', '960', '143', '7'].includes(serviceNo)) {
    deckType = (hash % 3 === 0) ? 'SD' : (hash % 4 === 0 && serviceNo === '190') ? 'BD' : 'DD';
  }

  // Live bus location interpolated backwards from the bus stop along a vector
  const distMeters = Math.max(50, Math.round(secondsRemaining * 7.5)); // ~27 km/h average
  const bearingOffset = ((hash % 8) * 45 * Math.PI) / 180;
  const dLat = (distMeters / 111320) * Math.cos(bearingOffset);
  const dLon = (distMeters / (111320 * Math.cos((stop.Latitude * Math.PI) / 180))) * Math.sin(bearingOffset);

  const busLat = (stop.Latitude - dLat).toFixed(5);
  const busLon = (stop.Longitude - dLon).toFixed(5);

  const stopsAway = Math.max(0, Math.floor(secondsRemaining / 120));

  return {
    OriginCode: route ? route.OriginCode : '00000',
    DestinationCode: destCode,
    DestinationName: destName,
    EstimatedArrival: arrivalDate.toISOString(),
    EstimatedArrivalSeconds: secondsRemaining,
    Latitude: busLat,
    Longitude: busLon,
    VisitNumber: '1',
    Load: load,
    Feature: 'WAB',
    Type: deckType,
    SpeedKmH: Math.round(20 + ((hash % 15))),
    DistanceMeters: distMeters,
    StopsAway: stopsAway,
  };
}

export class LTABusService {
  // Fetch real-time arrivals for a bus stop
  static async getBusArrivals(busStopCode: string): Promise<BusArrivalResponse> {
    const stop = SINGAPORE_BUS_STOPS.find((s) => s.BusStopCode === busStopCode);
    const nowMs = Date.now();

    // If user has provided live backend URL and enabled backend mode:
    if (LTA_API_CONFIG.useLiveBackend && LTA_API_CONFIG.backendUrl) {
      try {
        const response = await fetch(
          `${LTA_API_CONFIG.backendUrl}/api/bus-arrival?BusStopCode=${busStopCode}`,
          {
            headers: {
              ...(LTA_API_CONFIG.accountKey ? { 'AccountKey': LTA_API_CONFIG.accountKey } : {}),
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          return data;
        }
      } catch (err) {
        console.warn('Backend fetch failed, falling back to LTA simulation engine:', err);
      }
    }

    // Default authentic simulation engine:
    if (!stop) {
      return {
        BusStopCode: busStopCode,
        Services: [],
        timestamp: new Date().toISOString(),
      };
    }

    const services: LTAArrivalService[] = stop.Services.map((svcNo) => {
      const next1 = generateSimulatedNextBus(svcNo, stop, 1, nowMs);
      const next2 = generateSimulatedNextBus(svcNo, stop, 2, nowMs);
      const next3 = generateSimulatedNextBus(svcNo, stop, 3, nowMs);

      // Determine operator
      const route = POPULAR_BUS_ROUTES[svcNo];
      let operator: BusOperator = 'SBST';
      if (route) {
        operator = route.Operator;
      } else if (['190', '960', '972', '851', '980', '180'].includes(svcNo)) {
        operator = 'SMRT';
      } else if (['106', '143', '41', '49', '78'].includes(svcNo)) {
        operator = 'TTS';
      } else if (['36', '2', '12', '34'].includes(svcNo)) {
        operator = 'GAS';
      }

      return {
        ServiceNo: svcNo,
        Operator: operator,
        NextBus: next1,
        NextBus2: next2,
        NextBus3: next3,
      };
    });

    // Sort: services with arrival < 120s at the top, then alphanumeric
    services.sort((a, b) => {
      const diffTime = a.NextBus.EstimatedArrivalSeconds - b.NextBus.EstimatedArrivalSeconds;
      if (Math.abs(diffTime) > 60) return diffTime;
      return a.ServiceNo.localeCompare(b.ServiceNo, undefined, { numeric: true });
    });

    return {
      BusStopCode: busStopCode,
      Services: services,
      timestamp: new Date().toISOString(),
    };
  }

  // Search bus stops by code, road name, description, MRT, or service number
  static searchBusStops(query: string): BusStopData[] {
    const q = query.trim().toLowerCase();
    if (!q) return SINGAPORE_BUS_STOPS;

    return SINGAPORE_BUS_STOPS.filter((stop) => {
      const matchesCode = stop.BusStopCode.toLowerCase().includes(q);
      const matchesDesc = stop.Description.toLowerCase().includes(q);
      const matchesRoad = stop.RoadName.toLowerCase().includes(q);
      const matchesMrt = stop.MrtInterchange?.toLowerCase().includes(q);
      const matchesService = stop.Services.some((svc) => svc.toLowerCase() === q);
      return matchesCode || matchesDesc || matchesRoad || matchesMrt || matchesService;
    });
  }

  // Find nearby stops from latitude & longitude
  static getNearbyStops(lat: number, lng: number, limit = 8): BusStopData[] {
    const withDist = SINGAPORE_BUS_STOPS.map((stop) => ({
      ...stop,
      DistanceMeters: calculateDistanceMeters(lat, lng, stop.Latitude, stop.Longitude),
    }));

    withDist.sort((a, b) => (a.DistanceMeters ?? 0) - (b.DistanceMeters ?? 0));
    return withDist.slice(0, limit);
  }

  // Get route details for a bus service
  static getRoute(serviceNo: string): BusRouteData | undefined {
    return POPULAR_BUS_ROUTES[serviceNo];
  }

  // Get all active buses on road for live radar / map
  static getLiveVehicles(serviceNoFilter?: string): ActiveBusVehicle[] {
    const vehicles: ActiveBusVehicle[] = [];
    const nowMs = Date.now();

    const servicesToSimulate = serviceNoFilter
      ? [serviceNoFilter]
      : ['190', '36', '147', '65', '10', '106', '960'];

    servicesToSimulate.forEach((svc) => {
      const route = POPULAR_BUS_ROUTES[svc];
      if (!route || !route.Stops || route.Stops.length < 2) return;

      // Create 2-4 buses moving between stops along the route
      const numBuses = 3;
      for (let i = 0; i < numBuses; i++) {
        const stopIndex = (Math.floor(nowMs / 20000) + i * 2) % (route.Stops.length - 1);
        const currentStop = route.Stops[stopIndex];
        const nextStop = route.Stops[stopIndex + 1];

        // Interpolation progress 0..1
        const progress = ((nowMs % 20000) / 20000 + i * 0.33) % 1;
        const curLat = currentStop.Latitude + (nextStop.Latitude - currentStop.Latitude) * progress;
        const curLng = currentStop.Longitude + (nextStop.Longitude - currentStop.Longitude) * progress;

        // Calculate bearing in degrees
        const dLng = nextStop.Longitude - currentStop.Longitude;
        const dLat = nextStop.Latitude - currentStop.Latitude;
        const bearing = Math.round((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;

        let deck: BusDeckType = 'SD';
        if (['190', '147', '65', '10'].includes(svc)) {
          deck = i % 2 === 0 ? 'DD' : 'SD';
        }

        const loads: BusLoad[] = ['SEA', 'SDA', 'LSD'];
        const load = loads[(i + svc.length) % 3];

        vehicles.push({
          vehicleId: `SBS-${svc}-${i + 1}`,
          serviceNo: svc,
          operator: route.Operator,
          direction: route.Direction,
          deckType: deck,
          load: load,
          isWab: true,
          latitude: Number(curLat.toFixed(5)),
          longitude: Number(curLng.toFixed(5)),
          bearing: bearing,
          speedKmH: Math.round(25 + Math.sin(progress * Math.PI) * 15),
          nextStopCode: nextStop.BusStopCode,
          nextStopName: nextStop.Description,
          destinationName: route.DestinationName,
        });
      }
    });

    return vehicles;
  }
}
