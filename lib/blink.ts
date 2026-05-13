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

export type Favorite = {
  id: string;
  stationId: string;
  userId?: string;
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

export const fetchFavorites = async (userId?: string): Promise<Favorite[]> => {
  const query = userId ? { where: { user_id: userId } } : {};
  const result = await blink.db.favorites.list(query);
  return result.map((f: any) => ({
    id: f.id,
    stationId: f.station_id,
    userId: f.user_id,
  }));
};

export const addFavorite = async (stationId: string, userId?: string) => {
  return await blink.db.favorites.create({
    id: `fav_${Math.random().toString(36).substr(2, 9)}`,
    station_id: stationId,
    user_id: userId || null,
  });
};

export const removeFavorite = async (id: string) => {
  return await blink.db.favorites.delete(id);
};

export const registerPushToken = async (token: string, platform: string, userId?: string) => {
  try {
    return await blink.db.userPushTokens.upsert({
      token,
    }, {
      id: `tok_${Math.random().toString(36).substr(2, 9)}`,
      token,
      platform,
      user_id: userId || null,
    });
  } catch (error) {
    console.error('Error registering push token:', error);
  }
};