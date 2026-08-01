import React, { useMemo, useState } from 'react';
import {
  YStack, XStack, SizableText, SafeArea, AppHeader, Button, Card,
  Badge, toast, Spinner, MapPin, Navigation,
} from '@blinkdotnew/mobile-ui';
import { useQuery } from '@tanstack/react-query';
import { fetchStations, fetchPrices } from '@/lib/blink';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

const FUEL_TYPES = ['Gazole', 'SP95', 'SP98', 'E10', 'E85', 'GPLc'];

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radius = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MapScreen() {
  const router = useRouter();
  const [selectedFuel, setSelectedFuel] = useState('Gazole');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locating, setLocating] = useState(false);
  const stationsQuery = useQuery({ queryKey: ['stations'], queryFn: fetchStations });
  const pricesQuery = useQuery({ queryKey: ['prices'], queryFn: () => fetchPrices() });

  const requestLocation = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        toast('Autorisez la localisation pour voir les stations proches.', { variant: 'error' });
        return;
      }
      setLocation(await Location.getCurrentPositionAsync({}));
      toast('Position mise à jour', { variant: 'success' });
    } catch {
      toast('Impossible de récupérer votre position.', { variant: 'error' });
    } finally {
      setLocating(false);
    }
  };

  const nearby = useMemo(() => {
    if (!stationsQuery.data || !pricesQuery.data || !location) return [];
    return stationsQuery.data.map((station) => {
      const price = pricesQuery.data.find((item) => item.stationId === station.id && item.fuelType === selectedFuel);
      const distance = distanceKm(location.coords.latitude, location.coords.longitude, station.latitude, station.longitude);
      return { station, price, distance };
    }).filter((item) => item.price).sort((a, b) => a.distance - b.distance).slice(0, 20);
  }, [stationsQuery.data, pricesQuery.data, location, selectedFuel]);

  const loading = stationsQuery.isLoading || pricesQuery.isLoading;
  const error = stationsQuery.error || pricesQuery.error;

  return (
    <SafeArea flex={1} backgroundColor="$background">
      <AppHeader title="Carte des prix" rightElement={
        <Button size="$4" circular variant={location ? 'primary' : 'outline'} onPress={requestLocation} loading={locating} icon={<MapPin size={20} />} />
      } />
      <YStack paddingHorizontal="$4" gap="$3" paddingBottom="$3">
        <XStack gap="$2" flexWrap="wrap">
          {FUEL_TYPES.map((fuel) => (
            <Button key={fuel} size="$2" borderRadius="$8" variant={selectedFuel === fuel ? 'primary' : 'outline'} onPress={() => setSelectedFuel(fuel)}>
              {fuel}
            </Button>
          ))}
        </XStack>
      </YStack>

      {loading ? (
        <YStack flex={1} justifyContent="center" alignItems="center" gap="$3">
          <Spinner size="large" />
          <SizableText color="$color11">Chargement des stations...</SizableText>
        </YStack>
      ) : error ? (
        <YStack flex={1} justifyContent="center" alignItems="center" padding="$6" gap="$3">
          <SizableText size="$5" fontWeight="700" textAlign="center">Carte indisponible</SizableText>
          <SizableText color="$color11" textAlign="center">Vérifiez votre connexion puis réessayez.</SizableText>
          <Button theme="active" onPress={() => { stationsQuery.refetch(); pricesQuery.refetch(); }}>Réessayer</Button>
        </YStack>
      ) : !location ? (
        <YStack flex={1} justifyContent="center" alignItems="center" padding="$6" gap="$4">
          <MapPin size={64} color="$color7" />
          <SizableText size="$6" fontWeight="800" textAlign="center">Stations autour de vous</SizableText>
          <SizableText color="$color11" textAlign="center" maxWidth={300}>Activez la localisation pour classer les stations par distance et afficher leur prix.</SizableText>
          <Button theme="active" onPress={requestLocation} loading={locating}>Me localiser</Button>
        </YStack>
      ) : nearby.length === 0 ? (
        <YStack flex={1} justifyContent="center" alignItems="center" padding="$6" gap="$3">
          <Navigation size={56} color="$color7" />
          <SizableText size="$5" fontWeight="700" textAlign="center">Aucune station dans les 30 km</SizableText>
          <SizableText color="$color11" textAlign="center">Essayez un autre carburant ou explorez la liste complète.</SizableText>
          <Button variant="outlined" onPress={() => router.push('/')}>Explorer les stations</Button>
        </YStack>
      ) : (
        <YStack flex={1} paddingHorizontal="$4" gap="$2">
          <SizableText size="$3" color="$color11">{nearby.length} stations · {selectedFuel}</SizableText>
          {nearby.map(({ station, price, distance }, index) => (
            <Card key={station.id} padding="$3" backgroundColor="$color2" borderRadius="$4" onPress={() => router.push(`/station/${station.id}`)} pressStyle={{ scale: 0.98 }}>
              <XStack alignItems="center" justifyContent="space-between" gap="$3">
                <XStack flex={1} alignItems="center" gap="$2">
                  <SizableText width={22} fontWeight="800" color="$color9">{index + 1}</SizableText>
                  <YStack flex={1} gap="$1">
                    <SizableText fontWeight="700" numberOfLines={1}>{station.name}</SizableText>
                    <XStack gap="$2" alignItems="center">
                      <SizableText size="$2" color="$color11">{station.brand} · {station.city}</SizableText>
                      <Badge size="$1">{distance.toFixed(1)} km</Badge>
                    </XStack>
                  </YStack>
                </XStack>
                <YStack alignItems="flex-end">
                  <SizableText size="$5" fontWeight="800" color="$color12">{price?.price.toFixed(3)} €</SizableText>
                  <SizableText size="$1" color="$color9">par litre</SizableText>
                </YStack>
              </XStack>
            </Card>
          ))}
        </YStack>
      )}
    </SafeArea>
  );
}