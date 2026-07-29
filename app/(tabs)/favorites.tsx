import React from 'react';
import { YStack, XStack, SizableText, SafeArea, AppHeader, ScrollView, EmptyState, Heart, ListItem, Spinner } from '@blinkdotnew/mobile-ui';
import { useQuery } from '@tanstack/react-query';
import { fetchStations, fetchFavorites, fetchPrices } from '@/lib/blink';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

const FUEL_TYPES = ['Gazole', 'SP95', 'SP98', 'E10', 'E85', 'GPLc'];

export default function FavoritesScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const { data: stations, isLoading: loadingStations } = useQuery({
    queryKey: ['stations'],
    queryFn: fetchStations,
  });

  const { data: favorites, isLoading: loadingFavorites } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: () => fetchFavorites(user?.id),
    enabled: isAuthenticated,
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
      
      {!isAuthenticated ? (
        <YStack flex={1} justifyContent="center">
          <EmptyState
            icon={<Heart size={80} color="$color7" />}
            title="Connectez-vous"
            description="Connectez-vous pour sauvegarder vos stations préférées."
            onPress={() => router.push('/auth')}
            ctaLabel="Se connecter"
          />
        </YStack>
      ) : isLoading ? (
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Spinner size="large" />
        </YStack>
      ) : favoriteStations.length > 0 ? (
        <ScrollView flex={1}>
          <YStack gap="$2" padding="$4">
            {favoriteStations.map((station) => {
              const stationPrices = prices?.filter(p => p.stationId === station.id) || [];
              
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
                    <XStack gap="$2" flexWrap="wrap" justifyContent="flex-end">
                      {FUEL_TYPES.map(fuel => {
                        const fp = stationPrices.find(p => p.fuelType === fuel);
                        if (!fp) return null;
                        return (
                          <YStack key={fuel} alignItems="center" gap={2}>
                            <SizableText size="$1" color="$color9" fontWeight="600">{fuel}</SizableText>
                            <SizableText size="$3" fontWeight="800" color="$color12">{fp.price.toFixed(3)}</SizableText>
                          </YStack>
                        );
                      })}
                    </XStack>
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