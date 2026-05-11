import React from 'react';
import { YStack, SizableText, SafeArea, AppHeader, ScrollView, EmptyState, Heart } from '@blinkdotnew/mobile-ui';

export default function FavoritesScreen() {
  return (
    <SafeArea flex={1} backgroundColor="$background">
      <AppHeader title="Mes Favoris" />
      <YStack flex={1} justifyContent="center">
        <EmptyState
          icon={<Heart size={80} color="$color7" />}
          title="Aucun favori"
          description="Enregistrez vos stations préférées pour les retrouver rapidement ici."
        />
      </YStack>
    </SafeArea>
  );
}
