import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { registerPushToken } from '@/lib/blink';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function useNotifications(userId?: string) {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<Notifications.Notification>();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    let active = true;
    registerForPushNotificationsAsync().then((token) => {
      if (active && token) {
        setExpoPushToken(token);
        void registerPushToken(token, Platform.OS, userId);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener((incoming) => {
      if (active) setNotification(incoming);
    });
    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => undefined);

    return () => {
      active = false;
      notificationListener.current?.remove();
      responseListener.current?.remove();
      notificationListener.current = null;
      responseListener.current = null;
    };
  }, [userId]);

  return { expoPushToken, notification };
}

async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F59E0B',
    });
  }

  if (!Device.isDevice) return undefined;

  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') return undefined;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId || projectId === 'your-project-id-here') return undefined;

  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
}
