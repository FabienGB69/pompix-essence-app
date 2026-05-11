import React from 'react';
import { YStack, SizableText, SafeArea, AppHeader, EmptyState, MapPin } from '@blinkdotnew/mobile-ui';

export default function MapScreen() {
  return (
    <SafeArea flex={1} backgroundColor="$background">
      <AppHeader title="Carte des Prix" />
      <YStack flex={1} justifyContent="center">
        <EmptyState
          icon={<MapPin size={80} color="$color7" />}
          title="Carte interactive"
          description="Visualisez les stations essence les moins chères autour de vous sur une carte. (Bientôt disponible)"
        />
      </YStack>
    </SafeArea>
  );
}
