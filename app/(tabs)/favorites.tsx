import React from 'react';
import { YStack, SizableText, SafeArea, AppHeader, ScrollView, EmptyState, Heart, ListItem, Spinner } from '@blinkdotnew/mobile-ui';
import { useQuery } from '@tanstack/react-query';
import { fetchStations, fetchFavorites, fetchPrices } from '@/lib/blink';
import { useRouter } from 'expo-router';

export default function FavoritesScreen() {
  const router = useRouter();

  const { data: stations, isLoading: loadingStations } = useQuery({
    queryKey: ['stations'],
    queryFn: fetchStations,
  });

  const { data: favorites, isLoading: loadingFavorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => fetchFavorites(),
  });

  const { data: prices } = useQuery({
    queryKey: ['prices'],
    queryFn: () => fetchPrices(),
  });

  const favoriteStations = stations?.filter(s => 
    favorites?.some(f => f.stationId === s.id)
  ) || [];

  const isLoading = loadingStations || loadingFavorites;

  return (
    <SafeArea flex={1} backgroundColor="$background">
      <AppHeader title="Mes Favoris" />
      
      {isLoading ? (
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Spinner size="large" />
        </YStack>
      ) : favoriteStations.length > 0 ? (
        <ScrollView flex={1}>
          <YStack gap="$2" padding="$4">
            {favoriteStations.map((station) => {
              const gazolePrice = prices?.find(p => p.stationId === station.id && p.fuelType === 'Gazole')?.price;
              
              return (
                <ListItem
                  key={station.id}
                  title={station.name}
                  subtitle={`${station.brand} • ${station.city}`}
                  onPress={() => router.push(`/station/${station.id}`)}
                  backgroundColor="$color2"
                  borderRadius="$4"
                  marginVertical="$1"
                  pressTheme
                  rightElement={
                    gazolePrice ? (
                      <SizableText size="$5" fontWeight="800">
                        {gazolePrice.toFixed(3)} €
                      </SizableText>
                    ) : null
                  }
                />
              );
            })}
          </YStack>
        </ScrollView>
      ) : (
        <YStack flex={1} justifyContent="center">
          <EmptyState
            icon={<Heart size={80} color="$color7" />}
            title="Aucun favori"
            description="Enregistrez vos stations préférées pour les retrouver rapidement ici."
          />
        </YStack>
      )}
    </SafeArea>
  );
}
