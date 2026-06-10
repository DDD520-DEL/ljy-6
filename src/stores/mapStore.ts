import { create } from 'zustand';
import type { Observation } from '../../shared/types';

interface MapState {
  selectedObservation: Observation | null;
  mapCenter: [number, number];
  mapZoom: number;
  setSelectedObservation: (obs: Observation | null) => void;
  setMapCenter: (center: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  pendingNewObservation: { lat: number; lng: number; locationName?: string } | null;
  setPendingNewObservation: (v: { lat: number; lng: number; locationName?: string } | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedObservation: null,
  mapCenter: [31.2304, 116.4074],
  mapZoom: 5,
  setSelectedObservation: (obs) => set({ selectedObservation: obs }),
  setMapCenter: (center) => set({ mapCenter: center }),
  setMapZoom: (zoom) => set({ mapZoom: zoom }),
  flyTo: (lat, lng, zoom) => set({ mapCenter: [lat, lng], mapZoom: zoom ?? 11 }),
  pendingNewObservation: null,
  setPendingNewObservation: (v) => set({ pendingNewObservation: v }),
}));
