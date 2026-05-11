import React from 'react';
import { YStack, SafeArea, AppHeader, SettingsScreen, type SettingsSection, User, Bell, Shield, Info, Map as MapIcon, RotateCcw } from '@blinkdotnew/mobile-ui';

export default function SettingsTab() {
  const sections: SettingsSection[] = [
    {
      title: 'Préférences',
      items: [
        { id: 'nav', title: 'Application de navigation', icon: <MapIcon size={18} />, onPress: () => {} },
        { id: 'notif', title: 'Notifications de prix', icon: <Bell size={18} />, type: 'toggle', value: true, onValueChange: () => {} },
      ],
    },
    {
      title: 'Compte',
      items: [
        { id: 'profile', title: 'Mon Profil', icon: <User size={18} />, onPress: () => {} },
        { id: 'security', title: 'Sécurité', icon: <Shield size={18} />, onPress: () => {} },
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
      <SettingsScreen sections={sections} />
    </SafeArea>
  );
}
