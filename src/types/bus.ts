export type BusLoad = 'SEA' | 'SDA' | 'LSD'; // Seats Available | Standing Available | Limited Standing
export type BusDeckType = 'SD' | 'DD' | 'BD'; // Single Deck | Double Deck | Bendy Bus
export type BusFeature = 'WAB' | ''; // Wheelchair Accessible Bus
export type BusOperator = 'SBST' | 'SMRT' | 'TTS' | 'GAS'; // SBS Transit, SMRT, Tower Transit, Go-Ahead

export interface LTANextBus {
  OriginCode: string;
  DestinationCode: string;
  DestinationName: string;
  EstimatedArrival: string; // ISO string
  EstimatedArrivalSeconds: number; // Countdown in seconds
  Latitude: string;
  Longitude: string;
  VisitNumber: string;
  Load: BusLoad;
  Feature: BusFeature;
  Type: BusDeckType;
  SpeedKmH?: number;
  DistanceMeters?: number;
  StopsAway?: number;
}

export interface LTAArrivalService {
  ServiceNo: string;
  Operator: BusOperator;
  NextBus: LTANextBus;
  NextBus2?: LTANextBus;
  NextBus3?: LTANextBus;
  pinned?: boolean;
}

export interface BusArrivalResponse {
  odata_metadata?: string;
  BusStopCode: string;
  Services: LTAArrivalService[];
  timestamp: string;
}

export interface BusStopData {
  BusStopCode: string;
  RoadName: string;
  Description: string;
  Latitude: number;
  Longitude: number;
  Services: string[];
  MrtInterchange?: string; // e.g. "EW24/NS1 Jurong East", "NS22 Orchard", "DT14/EW12 Bugis"
  DistanceMeters?: number;
}

export interface RouteStopDetail {
  StopSequence: number;
  BusStopCode: string;
  RoadName: string;
  Description: string;
  Latitude: number;
  Longitude: number;
  DistanceKm: number;
  MrtTransfer?: string;
}

export interface BusRouteData {
  ServiceNo: string;
  Operator: BusOperator;
  Direction: 1 | 2;
  OriginCode: string;
  OriginName: string;
  DestinationCode: string;
  DestinationName: string;
  FirstBusWeekday: string;
  LastBusWeekday: string;
  FrequencyPeak: string; // e.g. "5 - 8 mins"
  FrequencyOffPeak: string; // e.g. "10 - 15 mins"
  LoopDesc?: string;
  Stops: RouteStopDetail[];
}

export interface ActiveBusVehicle {
  vehicleId: string;
  serviceNo: string;
  operator: BusOperator;
  direction: 1 | 2;
  deckType: BusDeckType;
  load: BusLoad;
  isWab: boolean;
  latitude: number;
  longitude: number;
  bearing: number;
  speedKmH: number;
  nextStopCode: string;
  nextStopName: string;
  destinationName: string;
}

export interface CommuterAlarm {
  id: string;
  busStopCode: string;
  busStopName: string;
  serviceNo: string;
  destinationName: string;
  thresholdMinutes: number;
  triggered: boolean;
  createdAt: number;
}
