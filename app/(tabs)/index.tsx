import React, { useState, useMemo, useEffect } from 'react';
import {
  YStack, XStack, SizableText, Input, ScrollView, SafeArea,
  Button, ListItem, Badge, AppHeader, toast,
  Search, MapPin, User, ArrowUpDown, Sliders,
} from '@blinkdotnew/mobile-ui';
import { useQuery } from '@tanstack/react-query';
import { fetchStations, fetchPrices } from '@/lib/blink';
import type { Station, Price } from '@/lib/blink';
import { useRouter } from 'expo-router';
import { RefreshControl } from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from '@/context/AuthContext';

const FUEL_TYPES = [
  { label: 'Gazole', value: 'Gazole' },
  { label: 'SP95', value: 'SP95' },
  { label: 'SP98', value: 'SP98' },
  { label: 'E10', value: 'E10' },
  { label: 'E85', value: 'E85' },
  { label: 'GPLc', value: 'GPLc' },
];
const RADIUS_OPTIONS = [5, 10, 20, 50];

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

type StationEnriched = Station & {
  price?: number;
  allPrices: Price[];
  distance?: number;
};
export default function ExploreScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [selectedFuel, setSelectedFuel] = useState('Gazole');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [sortMode, setSortMode] = useState<'distance' | 'price'>('price');
  const [radiusKm, setRadiusKm] = useState<number | null>(20);
  const [showFilters, setShowFilters] = useState(false);

  const { data: stations, isLoading: loadingStations, refetch: refetchStations } = useQuery({
    queryKey: ['stations'],
    queryFn: fetchStations,
  });
  const { data: prices, isLoading: loadingPrices, refetch: refetchPrices } = useQuery({
    queryKey: ['prices'],
    queryFn: () => fetchPrices(),
  });

  useEffect(() => {
    if (userLocation) setSortMode('distance');
  }, [userLocation]);
  const requestLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        toast('Permission de localisation refusée', { variant: 'error' });
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
      toast('Localisation activée', { variant: 'success' });
    } catch {
      toast('Erreur de localisation', { variant: 'error' });
    } finally {
      setIsLocating(false);
    }
  };

  const onRefresh = async () => {
    await Promise.all([refetchStations(), refetchPrices()]);
    toast('Mis à jour', { variant: 'success' });
  };

  const filteredStations: StationEnriched[] = useMemo(() => {
    if (!stations || !prices) return [];
    let results: StationEnriched[] = stations
      .filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.zipCode.includes(searchQuery))
      .map((s) => {
        const stationPrices = prices.filter((p) => p.stationId === s.id);
        const fuelPrice = stationPrices.find((p) => p.fuelType === selectedFuel);
        const distance = userLocation
          ? calculateDistance(
              userLocation.coords.latitude, userLocation.coords.longitude,
              s.latitude, s.longitude)
          : undefined;
        return { ...s, price: fuelPrice?.price, allPrices: stationPrices, distance };
      })
      .filter((s) => s.price !== undefined);
    if (userLocation && radiusKm !== null) {
      results = results.filter((s) => s.distance !== undefined && s.distance <= radiusKm);
    }
    if (sortMode === 'distance' && userLocation) {
      results.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    } else {
      results.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    }
    return results;
  }, [stations, prices, searchQuery, selectedFuel, userLocation, sortMode, radiusKm]);

  const isLoading = loadingStations || loadingPrices;
  const isSortingByPrice = sortMode === 'price' || !userLocation;

  const rightElement = (
    <XStack gap="$2" alignItems="center">
      <Button size="$4" circular variant={userLocation ? 'primary' : 'outline'}
        onPress={requestLocation} loading={isLocating} icon={<MapPin size={20} />} />
      {!isAuthenticated && (
        <Button size="$4" circular variant="outline"
          onPress={() => router.push('/auth')} icon={<User size={20} />} />
      )}
    </XStack>
  );

  return (
    <SafeArea flex={1} backgroundColor="$background">
      <AppHeader title="Pompix Essence" rightElement={rightElement} />

      <XStack paddingHorizontal="$4" paddingBottom="$2" gap="$2" alignItems="center">
        <XStack flex={1} gap="$2" alignItems="center" backgroundColor="$color2"
          paddingHorizontal="$4" borderRadius="$10" height={44}>
          <Search size={18} color="$color9" />
          <Input flex={1} placeholder="Ville, code postal..." value={searchQuery}
            onChangeText={setSearchQuery} borderWidth={0}
            backgroundColor="transparent" height="100%" />
        </XStack>
      </XStack>

      <ScrollView flex={1} contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}>
        <YStack paddingHorizontal="$4" gap="$4" paddingBottom="$4">
          <YStack gap="$2">
            <SizableText size="$3" fontWeight="600" color="$color11">
              Type de carburant
            </SizableText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <XStack gap="$2">
                {FUEL_TYPES.map((fuel) => (
                  <Button key={fuel.value} size="$3" borderRadius="$10"
                    variant={selectedFuel === fuel.value ? 'primary' : 'outline'}
                    onPress={() => setSelectedFuel(fuel.value)}>
                    {fuel.label}
                  </Button>
                ))}
              </XStack>
            </ScrollView>
          </YStack>

          <Button size="$3" variant="outline" borderRadius="$10"
            onPress={() => setShowFilters(!showFilters)} icon={<Sliders size={16} />}>
            Filtres
          </Button>

          {showFilters && (
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center" flexWrap="wrap">
                <Button size="$2" borderRadius="$8" variant="outline"
                  icon={sortMode === 'distance' ? <MapPin size={14} /> : <ArrowUpDown size={14} />}
                  onPress={() => setSortMode(sortMode === 'distance' ? 'price' : 'distance')}>
                  {sortMode === 'distance' ? 'Distance' : 'Prix'}
                </Button>
              </XStack>
              {userLocation && (
                <XStack gap="$1" flexWrap="wrap">
                  {RADIUS_OPTIONS.map((r) => (
                    <Button key={r} size="$2" borderRadius="$8"
                      variant={radiusKm === r ? 'primary' : 'outline'}
                      onPress={() => setRadiusKm(r)}>
                      {r} km
                    </Button>
                  ))}
                  <Button size="$2" borderRadius="$8"
                    variant={radiusKm === null ? 'primary' : 'outline'}
                    onPress={() => setRadiusKm(null)}>
                    Toutes
                  </Button>
                </XStack>
              )}
            </YStack>
          )}
        </YStack>

        {isLoading ? (
          <YStack gap="$2" paddingHorizontal="$4">
            {Array.from({ length: 5 }).map((_, i) => (
              <YStack key={i} height={80} backgroundColor="$color2"
                borderRadius="$4" opacity={0.5} />
            ))}
          </YStack>
        ) : filteredStations.length > 0 ? (
          <YStack gap="$2" paddingHorizontal="$4">
            {filteredStations.map((station, index) => (
              <ListItem key={station.id} title={station.name}
                subtitle={`${station.brand} • ${station.city}${station.distance ? ` • ${station.distance.toFixed(1)} km` : ''}`}
                onPress={() => router.push(`/station/${station.id}`)}
                backgroundColor="$color2" borderRadius="$4" marginVertical="$1" pressTheme
                rightElement={
                  <YStack alignItems="flex-end" gap="$1">
                    <XStack gap="$2" flexWrap="wrap" justifyContent="flex-end">
                      {station.allPrices.slice(0, 3).map((p) => (
                        <YStack key={p.fuelType} alignItems="center" gap={2}>
                          <SizableText size="$1" color="$color9" fontWeight="600">
                            {p.fuelType}
                          </SizableText>
                          <SizableText size="$3"
                            fontWeight={p.fuelType === selectedFuel ? '800' : '400'}
                            color={p.fuelType === selectedFuel ? '$color12' : '$color10'}>
                            {p.price.toFixed(3)}
                          </SizableText>
                        </YStack>
                      ))}
                    </XStack>
                    {isSortingByPrice && index === 0 && (
                      <Badge variant="success" size="$1">MOINS CHER</Badge>
                    )}
                  </YStack>
                }
              />
            ))}
          </YStack>
        ) : (
          <YStack flex={1} justifyContent="center" alignItems="center"
            paddingTop="$10" paddingHorizontal="$10">
            <SizableText textAlign="center" color="$color11" size="$4">
              Aucune station trouvée pour ce carburant ou cette recherche.
            </SizableText>
            <SizableText textAlign="center" color="$color9" size="$3" marginTop="$2">
              Essayez d'élargir votre rayon ou de changer de carburant.
            </SizableText>
          </YStack>
        )}
      </ScrollView>
    </SafeArea>
  );
}
