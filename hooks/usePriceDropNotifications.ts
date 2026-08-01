import { useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useQuery } from '@tanstack/react-query';
import { fetchFavorites, fetchPrices, fetchStations } from '@/lib/blink';

const SNAPSHOT_PREFIX = 'carbufox:price-snapshot:';

type PriceSnapshot = Record<string, number>;

export function usePriceDropNotifications(userId?: string) {
  const favoritesQuery = useQuery({
    queryKey: ['favorites', userId, 'price-drop-monitor'],
    queryFn: () => fetchFavorites(userId),
    enabled: !!userId,
  });
  const pricesQuery = useQuery({
    queryKey: ['prices', 'price-drop-monitor'],
    queryFn: () => fetchPrices(),
    enabled: !!userId,
  });
  const stationsQuery = useQuery({
    queryKey: ['stations', 'price-drop-monitor'],
    queryFn: fetchStations,
    enabled: !!userId,
  });

  useEffect(() => {
    if (Platform.OS === 'web' || !userId || !favoritesQuery.data || !pricesQuery.data || !stationsQuery.data) return;

    let cancelled = false;
    const processDrops = async () => {
      const storageKey = `${SNAPSHOT_PREFIX}${userId}`;
      const stored = await AsyncStorage.getItem(storageKey);
      const previous: PriceSnapshot = stored ? JSON.parse(stored) : {};
      const favoriteIds = new Set(favoritesQuery.data.map((favorite) => favorite.stationId));
      const stationNames = new Map(stationsQuery.data.map((station) => [station.id, station.name]));
      const current: PriceSnapshot = {};
      const drops: Array<{ stationId: string; fuelType: string; oldPrice: number; newPrice: number }> = [];

      pricesQuery.data.forEach((price) => {
        if (!favoriteIds.has(price.stationId)) return;
        const key = `${price.stationId}:${price.fuelType}`;
        current[key] = price.price;
        if (previous[key] !== undefined && price.price < previous[key] - 0.001) {
          drops.push({ stationId: price.stationId, fuelType: price.fuelType, oldPrice: previous[key], newPrice: price.price });
        }
      });

      if (!cancelled && drops.length > 0) {
        const permission = await Notifications.getPermissionsAsync();
        if (permission.status === 'granted') {
          for (const drop of drops.slice(0, 3)) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: 'Baisse de prix ⛽',
                body: `${stationNames.get(drop.stationId) || 'Votre station favorite'} : ${drop.fuelType} passe de ${drop.oldPrice.toFixed(3)} € à ${drop.newPrice.toFixed(3)} €/L.`,
                data: { stationId: drop.stationId, fuelType: drop.fuelType },
              },
              trigger: null,
            });
          }
        }
      }

      await AsyncStorage.setItem(storageKey, JSON.stringify(current));
    };

    processDrops().catch(() => undefined);
    return () => { cancelled = true; };
  }, [userId, favoritesQuery.data, pricesQuery.data, stationsQuery.data]);
}
