import React, { useState, useMemo } from 'react';
import { YStack, XStack, SizableText, SafeArea, AppHeader, Button, Card, Badge, toast, Spinner, MapPin } from '@blinkdotnew/mobile-ui';
import { useQuery } from '@tanstack/react-query';
import { fetchStations, fetchPrices } from '@/lib/blink';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

const FUEL_TYPES = ['Gazole', 'SP95', 'SP98', 'E10', 'E85', 'GPLc'];

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function MapScreen() {
  const router = useRouter();
  const [selectedFuel, setSelectedFuel] = useState('Gazole');
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const { data: stations, isLoading: loadingStations } = useQuery({ queryKey: ['stations'], queryFn: fetchStations });
  const { data: prices, isLoading: loadingPrices } = useQuery({ queryKey: ['prices'], queryFn: () => fetchPrices() });

  const isLoading = loadingStations || loadingPrices;

  const requestLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { toast('Permission refusée', { variant: 'error' }); return; }
      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation(loc);
      toast('Localisation activée', { variant: 'success' });
    } catch {
      toast('Erreur de localisation', { variant: 'error' });
    } finally {
      setIsLocating(false);
    }
  };

  const nearbyStations = useMemo(() => {
    if (!stations || !prices) return [];
    return stations
      .map((s) => {
        const sp = prices.filter((p) => p.stationId === s.id);
        const fp = sp.find((p) => p.fuelType === selectedFuel);
        const d = userLocation
          ? calculateDistance(userLocation.coords.latitude, userLocation.coords.longitude, s.latitude, s.longitude)
          : undefined;
        return { ...s, price: fp?.price, allPrices: sp, distance: d };
      })
      .filter((s) => s.price !== undefined)
      .filter((s) => !userLocation || (s.distance != null && s.distance <= 30))
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
      .slice(0, 20);
  }, [stations, prices, selectedFuel, userLocation]);

  return (
    <SafeArea flex={1} backgroundColor="$background">
      <AppHeader
        title="Carte des Prix"
        rightElement={
          <Button
            size="$4"
            circular
            variant={userLocation ? 'primary' : 'outline'}
            onPress={requestLocation}
            loading={isLocating}
            icon={<MapPin size={20} />}
          />
        }
      />

      <XStack paddingHorizontal="$4" paddingBottom="$2" gap="$2">
        {FUEL_TYPES.slice(0, 3).map((fuel) => (
          <Button
            key={fuel}
            size="$2"
            borderRadius="$8"
            variant={selectedFuel === fuel ? 'primary' : 'outline'}
            onPress={() => setSelectedFuel(fuel)}
          >
            {fuel}
          </Button>
        ))}
      </XStack>

      <YStack flex={1} paddingHorizontal="$4" paddingTop="$2">
        {isLoading ? (
          <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
            <Spinner size="large" />
            <SizableText color="$color11">Chargement des stations...</SizableText>
          </YStack>
        ) : !userLocation ? (
          <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
            <MapPin size={64} color="$color7" />
            <SizableText color="$color11" textAlign="center" size="$4" fontWeight="600">
              Carte des stations
            </SizableText>
            <SizableText color="$color9" textAlign="center" size="$3" maxWidth={280}>
              Activez votre position pour voir les stations les plus proches classées par distance.
            </SizableText>
            <Button variant="primary" onPress={requestLocation} loading={isLocating}>
              Me localiser
            </Button>
          </YStack>
        ) : nearbyStations.length === 0 ? (
          <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
            <MapPin size={64} color="$color7" />
            <SizableText color="$color11" textAlign="center">
              Aucune station trouvée dans un rayon de 30 km.
            </SizableText>
          </YStack>
        ) : (
          <YStack flex={1} gap="$2">
            <SizableText size="$3" color="$color11" marginBottom="$1">
              {selectedFuel} — {nearbyStations.length} stations à proximité
            </SizableText>
            {nearbyStations.map((s, idx) => (
              <Card
                key={s.id}
                padding="$3"
                backgroundColor="$color2"
                borderRadius="$4"
                pressStyle={{ scale: 0.98 }}
                onPress={() => router.push(`/station/${s.id}`)}
              >
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack flex={1} gap={4}>
                    <XStack gap="$2" alignItems="center">
                      <SizableText size="$2" fontWeight="800" color="$color9" width={20}>
                        {idx + 1}
                      </SizableText>
                      <SizableText fontWeight="700" size="$4" numberOfLines={1}>
                        {s.name}
                      </SizableText>
                    </XStack>
                    <XStack gap="$2" alignItems="center" paddingLeft={20}>
                      <SizableText size="$2" color="$color9">
                        {s.brand} · {s.city}
                      </SizableText>
                      {s.distance != null && (
                        <Badge variant="outline" size="$1" paddingHorizontal="$2">
                          {s.distance.toFixed(1)} km
                        </Badge>
                      )}
                    </XStack>
                  </YStack>
                  <YStack alignItems="flex-end" minWidth={70}>
                    <SizableText size="$5" fontWeight="800" color="$color12">
                      {s.price?.toFixed(3)}
                    </SizableText>
                    <SizableText size="$1" color="$color9">
                      €/L
                    </SizableText>
                  </YStack>
                </XStack>
              </Card>
            ))}
          </YStack>
        )}
      </YStack>
    </SafeArea>
  );
}
