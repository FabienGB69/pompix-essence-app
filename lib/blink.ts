import { createClient, AsyncStorageAdapter } from '@blinkdotnew/sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';

export const blink = createClient({
  projectId: process.env.EXPO_PUBLIC_BLINK_PROJECT_ID!,
  authRequired: false,
  auth: { mode: 'headless', webBrowser: WebBrowser },
  storage: new AsyncStorageAdapter(AsyncStorage)
});

export type Station = {
  id: string;
  name: string;
  brand: string;
  address: string;
  city: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  services: string[];
};

export type Price = {
  id: string;
  stationId: string;
  fuelType: string;
  price: number;
  updatedAt: string;
};

export const fetchStations = async (): Promise<Station[]> => {
  const result = await blink.db.stations.list();
  return result.map((s: any) => ({
    ...s,
    zipCode: s.zip_code,
    services: JSON.parse(s.services || '[]')
  }));
};

export const fetchPrices = async (stationId?: string): Promise<Price[]> => {
  const query = stationId ? { where: { station_id: stationId } } : {};
  const result = await blink.db.prices.list(query);
  return result.map((p: any) => ({
    ...p,
    stationId: p.station_id,
    fuelType: p.fuel_type,
    updatedAt: p.updated_at
  }));
};
