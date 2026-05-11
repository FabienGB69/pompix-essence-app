import React, { useState, useMemo } from 'react';
import { YStack, XStack, SizableText, Input, Search, ScrollView, SafeArea, Button, ChipGroup, ListItem, Badge, AppHeader, Spinner, toast } from '@blinkdotnew/mobile-ui';
import { useQuery } from '@tanstack/react-query';
import { fetchStations, fetchPrices, Station, Price } from '@/lib/blink';
import { useRouter } from 'expo-router';
import { RefreshControl } from 'react-native';

const FUEL_TYPES = [
  { label: 'Gazole', value: 'Gazole' },
  { label: 'SP95', value: 'SP95' },
  { label: 'SP98', value: 'SP98' },
  { label: 'E10', value: 'E10' },
  { label: 'E85', value: 'E85' },
  { label: 'GPLc', value: 'GPLc' },
];

export default function ExploreScreen() {
  const router = useRouter();
  const [selectedFuel, setSelectedFuel] = useState('Gazole');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: stations, isLoading: loadingStations, refetch: refetchStations } = useQuery({
    queryKey: ['stations'],
    queryFn: fetchStations,
  });

  const { data: prices, isLoading: loadingPrices, refetch: refetchPrices } = useQuery({
    queryKey: ['prices'],
    queryFn: () => fetchPrices(),
  });

  const onRefresh = async () => {
    await Promise.all([refetchStations(), refetchPrices()]);
    toast('Mis à jour', { variant: 'success' });
  };

  const filteredStations = useMemo(() => {
    if (!stations || !prices) return [];
    
    return stations
      .filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.zipCode.includes(searchQuery)
      )
      .map(s => {
        const stationPrices = prices.filter(p => p.stationId === s.id);
        const fuelPrice = stationPrices.find(p => p.fuelType === selectedFuel);
        return {
          ...s,
          price: fuelPrice?.price,
          allPrices: stationPrices,
        };
      })
      .filter(s => s.price !== undefined)
      .sort((a, b) => (a.price || 0) - (b.price || 0));
  }, [stations, prices, searchQuery, selectedFuel]);

  const isLoading = loadingStations || loadingPrices;

  return (
    <SafeArea flex={1} backgroundColor="$background">
      <AppHeader title="Pompix Essence" />
      
      <YStack padding="$4" gap="$4">
        <XStack gap="$2" alignItems="center" backgroundColor="$color2" paddingHorizontal="$4" borderRadius="$10" height={50}>
          <Search size={20} color="$color9" />
          <Input 
            flex={1} 
            placeholder="Ville, code postal ou station..." 
            value={searchQuery}
            onChangeText={setSearchQuery}
            borderWidth={0}
            backgroundColor="transparent"
            height="100%"
          />
        </XStack>

        <YStack gap="$2">
          <SizableText size="$3" fontWeight="600" color="$color11">Type de carburant</SizableText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <XStack gap="$2">
              {FUEL_TYPES.map((fuel) => (
                <Button
                  key={fuel.value}
                  size="$3"
                  borderRadius="$10"
                  variant={selectedFuel === fuel.value ? 'primary' : 'outline'}
                  onPress={() => setSelectedFuel(fuel.value)}
                >
                  {fuel.label}
                </Button>
              ))}
            </XStack>
          </ScrollView>
        </YStack>
      </YStack>

      <ScrollView 
        flex={1} 
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
      >
        {isLoading ? (
          <YStack flex={1} justifyContent="center" alignItems="center" paddingTop="$10">
            <Spinner size="large" color="$color9" />
            <SizableText marginTop="$4" color="$color11">Chargement des stations...</SizableText>
          </YStack>
        ) : filteredStations.length > 0 ? (
          <YStack gap="$2" paddingHorizontal="$4">
            {filteredStations.map((station, index) => (
              <ListItem
                key={station.id}
                title={station.name}
                subtitle={`${station.brand} • ${station.city} (${station.zipCode})`}
                onPress={() => router.push(`/station/${station.id}`)}
                backgroundColor="$color2"
                borderRadius="$4"
                marginVertical="$1"
                pressTheme
                rightElement={
                  <YStack alignItems="flex-end" gap="$1">
                    <SizableText size="$5" fontWeight="800" color={index === 0 ? '$green9' : '$color12'}>
                      {station.price?.toFixed(3)} €
                    </SizableText>
                    {index === 0 && (
                      <Badge variant="success" size="$1">MOINS CHER</Badge>
                    )}
                  </YStack>
                }
              />
            ))}
          </YStack>
        ) : (
          <YStack flex={1} justifyContent="center" alignItems="center" paddingTop="$10" paddingHorizontal="$10">
            <SizableText textAlign="center" color="$color11">
              Aucune station trouvée pour ce carburant ou cette recherche.
            </SizableText>
          </YStack>
        )}
      </ScrollView>
    </SafeArea>
  );
}
