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
  openingHours: Record<string, string>;
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

export type Review = {
  id: string;
  stationId: string;
  userId?: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type PriceAlert = {
  id: string;
  stationId: string;
  fuelType: string;
  thresholdPrice: number;
  isActive: boolean;
};

export const fetchStations = async (): Promise<Station[]> => {
  const result = await blink.db.stations.list();
  return result.map((s: any) => ({
    ...s,
    zipCode: s.zip_code,
    services: JSON.parse(s.services || '[]'),
    openingHours: JSON.parse(s.opening_hours || '{}')
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

export const fetchReviews = async (stationId: string): Promise<Review[]> => {
  const result = await blink.db.reviews.list({
    where: { station_id: stationId },
    orderBy: { created_at: 'desc' }
  });
  return result.map((r: any) => ({
    id: r.id,
    stationId: r.station_id,
    userId: r.user_id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at
  }));
};

export const addReview = async (stationId: string, rating: number, comment: string, userId?: string) => {
  return await blink.db.reviews.create({
    id: `rev_${Math.random().toString(36).substr(2, 9)}`,
    station_id: stationId,
    rating,
    comment,
    user_id: userId || null,
  });
};

export const fetchPriceAlerts = async (userId?: string): Promise<PriceAlert[]> => {
  const query = userId ? { where: { user_id: userId } } : {};
  const result = await blink.db.priceAlerts.list(query);
  return result.map((a: any) => ({
    id: a.id,
    stationId: a.station_id,
    fuelType: a.fuel_type,
    thresholdPrice: a.threshold_price,
    isActive: Boolean(a.is_active),
  }));
};

export const createPriceAlert = async (stationId: string, fuelType: string, thresholdPrice: number, userId?: string) => {
  return await blink.db.priceAlerts.create({
    id: `alt_${Math.random().toString(36).substr(2, 9)}`,
    station_id: stationId,
    fuel_type: fuelType,
    threshold_price: thresholdPrice,
    user_id: userId || null,
    is_active: 1,
  });
};

export const deletePriceAlert = async (id: string) => {
  return await blink.db.priceAlerts.delete(id);
};