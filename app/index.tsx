import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('hasSeenOnboarding').then((val) => {
      setTarget(val === 'true' ? '/(tabs)' : '/onboarding');
    }).catch(() => setTarget('/(tabs)'));
  }, []);

  if (!target) return null;
  return <Redirect href={target} />;
}
