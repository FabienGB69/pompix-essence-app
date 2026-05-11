import React, { useState } from 'react';
import { YStack, XStack, SizableText, SafeArea, Button, AppHeader, ScrollView, Card, MapPin, Navigation, Share2, Heart, Divider, Badge, useTheme, toast } from '@blinkdotnew/mobile-ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchStations, fetchPrices } from '@/lib/blink';
import { Linking, Platform } from 'react-native';

export default function StationDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const [isFavorite, setIsFavorite] = useState(false);

  const { data: stations } = useQuery({
    queryKey: ['stations'],
    queryFn: fetchStations,
  });

  const { data: prices } = useQuery({
    queryKey: ['prices', id],
    queryFn: () => fetchPrices(id as string),
  });

  const station = stations?.find(s => s.id === id);

  if (!station) return null;

  const openInMaps = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${station.latitude},${station.longitude}(${station.name})`,
      android: `geo:0,0?q=${station.latitude},${station.longitude}(${station.name})`,
    });
    if (url) Linking.openURL(url);
  };

  const openInWaze = () => {
    const url = `https://waze.com/ul?ll=${station.latitude},${station.longitude}&navigate=yes`;
    Linking.openURL(url);
  };

  const onShare = () => {
    toast('Partagé !', { variant: 'success' });
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast(isFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris', { variant: isFavorite ? 'default' : 'success' });
  };

  return (
    <SafeArea flex={1} backgroundColor="$background">
      <AppHeader 
        title={station.brand} 
        variant="back" 
        onBack={() => router.back()}
        rightElement={
          <XStack gap="$2">
            <Button size="$3" circular onPress={onShare} chromeless icon={<Share2 size={20} color="$color11" />} />
            <Button size="$3" circular onPress={toggleFavorite} chromeless icon={<Heart size={20} color={isFavorite ? '$red9' : '$color11'} fill={isFavorite ? '$red9' : 'transparent'} />} />
          </XStack>
        }
      />

      <ScrollView flex={1}>
        <YStack padding="$4" gap="$6">
          <YStack gap="$2">
            <SizableText size="$8" fontWeight="800" color="$color12">{station.name}</SizableText>
            <XStack gap="$2" alignItems="center">
              <MapPin size={16} color="$color9" />
              <SizableText color="$color11">{station.address}, {station.city}</SizableText>
            </XStack>
          </YStack>

          <Card padding="$4" backgroundColor="$color2" borderRadius="$6" elevation={2}>
            <YStack gap="$4">
              <SizableText size="$5" fontWeight="700">Prix des carburants</SizableText>
              <YStack gap="$2">
                {prices?.map((price) => (
                  <XStack key={price.id} justifyContent="space-between" alignItems="center" paddingVertical="$2" borderBottomWidth={1} borderBottomColor="$color3">
                    <SizableText fontWeight="600">{price.fuelType}</SizableText>
                    <XStack gap="$2" alignItems="center">
                      <SizableText size="$6" fontWeight="800" color="$color12">{price.price.toFixed(3)} €</SizableText>
                      <SizableText size="$2" color="$color9">Il y a 2h</SizableText>
                    </XStack>
                  </XStack>
                ))}
              </YStack>
            </YStack>
          </Card>

          <YStack gap="$4">
            <SizableText size="$5" fontWeight="700">Navigation</SizableText>
            <XStack gap="$4">
              <Button flex={1} variant="primary" icon={<Navigation size={20} />} onPress={openInMaps}>
                Maps
              </Button>
              <Button flex={1} variant="outline" onPress={openInWaze}>
                Waze
              </Button>
            </XStack>
          </YStack>

          <YStack gap="$4">
            <SizableText size="$5" fontWeight="700">Services</SizableText>
            <XStack flexWrap="wrap" gap="$2">
              {station.services.map((service, idx) => (
                <Badge key={idx} variant="outline" paddingHorizontal="$3" paddingVertical="$1">
                  {service}
                </Badge>
              ))}
            </XStack>
          </YStack>
        </YStack>
      </ScrollView>
    </SafeArea>
  );
}
