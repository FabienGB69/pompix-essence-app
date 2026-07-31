import React, { useState } from 'react';
import { YStack, XStack, SizableText, SafeArea, Button, AppHeader, ScrollView, ListItem, Divider, Switch, toast, Bell, ChevronRight, User, Info, Map as MapIcon, Trash2, Shield, RotateCcw, LogOut, LogIn } from '@blinkdotnew/mobile-ui';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPriceAlerts, deletePriceAlert, blink } from '@/lib/blink';
import { useAuth } from '@/context/AuthContext';

type SettingsItem = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  type?: 'toggle';
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  destructive?: boolean;
};

type SettingsSection = {
  title: string;
  items: SettingsItem[];
};

export default function SettingsTab() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const { data: priceAlerts, isLoading: loadingAlerts } = useQuery({
    queryKey: ['priceAlerts'],
    queryFn: () => fetchPriceAlerts(),
  });

  const removeAlertMutation = useMutation({
    mutationFn: (id: string) => deletePriceAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceAlerts'] });
      toast('Alerte supprimée');
    },
  });

  const sections: SettingsSection[] = [
    {
      title: 'Préférences',
      items: [
        { id: 'nav', title: 'Application de navigation', icon: <MapIcon size={18} />, onPress: () => {} },
        { 
          id: 'notif', 
          title: 'Alertes de prix (Pro)', 
          subtitle: 'Nécessite un plan Pro pour le serveur',
          icon: <Bell size={18} />, 
          type: 'toggle', 
          value: false, 
          onValueChange: () => {
            toast('Cette fonctionnalité nécessite un plan Pro pour le backend.', { variant: 'info' });
          } 
        },
      ],
    },
    {
      title: 'Compte',
      items: isAuthenticated ? [
        { id: 'profile', title: user?.email || 'Mon Profil', icon: <User size={18} />, onPress: () => {} },
        { id: 'logout', title: 'Se déconnecter', icon: <LogOut size={18} />, onPress: async () => {
          await blink.auth.signOut();
          toast('Déconnecté');
          queryClient.invalidateQueries({ queryKey: ['priceAlerts'] });
        } },
      ] : [
        { id: 'login', title: 'Se connecter', icon: <LogIn size={18} />, onPress: () => router.push('/auth') },
      ],
    },
    {
      title: 'Application',
      items: [
        { id: 'about', title: 'À propos de Pompix', icon: <Info size={18} />, onPress: () => {} },
        { id: 'reset', title: 'Réinitialiser les données', icon: <RotateCcw size={18} />, destructive: true, onPress: () => {} },
      ],
    },
  ];

  return (
    <SafeArea flex={1} backgroundColor="$background">
      <AppHeader title="Réglages" />
      <ScrollView flex={1}>
        <YStack padding="$4" gap="$6">
          {priceAlerts && priceAlerts.length > 0 && (
            <YStack gap="$2">
              <SizableText size="$3" fontWeight="600" color="$color11" marginLeft="$2" marginBottom="$1">
                Mes Alertes Actives ({priceAlerts.length})
              </SizableText>
              <YStack backgroundColor="$color2" borderRadius="$4" overflow="hidden">
                {priceAlerts.map((alert, index) => (
                  <YStack key={alert.id}>
                    <ListItem
                      title={alert.fuelType}
                      subtitle={`Alerte si ${'<'} ${alert.thresholdPrice.toFixed(3)} €`}
                      onPress={() => router.push(`/station/${alert.stationId}`)}
                      backgroundColor="transparent"
                      rightElement={
                        <Button 
                          size="$2" 
                          variant="ghost" 
                          circular 
                          icon={<Trash2 size={18} color="$red9" />} 
                          onPress={(e) => {
                            e.stopPropagation();
                            removeAlertMutation.mutate(alert.id);
                          }}
                        />
                      }
                    />
                    {index < priceAlerts.length - 1 && <Divider />}
                  </YStack>
                ))}
              </YStack>
            </YStack>
          )}

          {sections.map((section, index) => (
            <YStack key={index} gap="$2">
              <SizableText size="$3" fontWeight="600" color="$color11" marginLeft="$2" marginBottom="$1">
                {section.title}
              </SizableText>
              <YStack backgroundColor="$color2" borderRadius="$4" overflow="hidden">
                {section.items.map((item, itemIndex) => (
                  <YStack key={item.id}>
                    <ListItem
                      title={item.title}
                      subtitle={item.subtitle}
                      icon={item.icon}
                      onPress={item.onPress}
                      pressStyle={{ backgroundColor: '$color3' }}
                      hoverStyle={{ backgroundColor: '$color3' }}
                      backgroundColor="transparent"
                      rightElement={
                        item.type === 'toggle' ? (
                          <Switch
                            checked={item.value}
                            onCheckedChange={item.onValueChange}
                            size="$2"
                          />
                        ) : item.destructive ? (
                          <Button
                            size="$2"
                            variant="ghost"
                            circular
                            icon={<Trash2 size={18} color="$red9" />}
                            onPress={(e) => {
                              e.stopPropagation();
                              item.onPress?.();
                            }}
                          />
                        ) : (
                          <ChevronRight size={18} color="$color9" />
                        )
                      }
                    />
                    {itemIndex < section.items.length - 1 && <Divider />}
                  </YStack>
                ))}
              </YStack>
            </YStack>
          ))}
        </YStack>
      </ScrollView>
    </SafeArea>
  );
}
