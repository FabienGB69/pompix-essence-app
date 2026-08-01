import React, { useEffect, useState } from 'react';
import { YStack, XStack, SizableText, SafeArea, Button, Spinner } from '@blinkdotnew/mobile-ui';
import { useRouter, Redirect } from 'expo-router';
import { Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STEPS = [
  {
    emoji: '⛽',
    title: 'Le carburant le moins cher',
    body: 'Comparez les prix de toutes les stations autour de vous en temps réel.',
    buttonLabel: 'Suivant',
  },
  {
    emoji: '🔔',
    title: 'Ne ratez aucune baisse',
    body: 'Créez des alertes de prix et soyez notifié quand le carburant baisse.',
    buttonLabel: "C'est parti !",
  },
] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [checking, setChecking] = useState(true);
  const step = STEPS[currentStep];

  useEffect(() => {
    AsyncStorage.getItem('hasSeenOnboarding').then((value) => {
      if (value === 'true') router.replace('/(tabs)');
      else setChecking(false);
    }).catch(() => setChecking(false));
  }, [router]);

  if (checking) {
    return (
      <SafeArea flex={1} backgroundColor="$background" justifyContent="center" alignItems="center">
        <Spinner size="large" color="$color9" />
      </SafeArea>
    );
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleFinish = () => {
    AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/(tabs)');
  };

  return (
    <SafeArea flex={1} backgroundColor="$background">
      <YStack flex={1} justifyContent="space-between" padding="$6">
        {/* Skip link - only on second screen */}
        <XStack justifyContent="flex-end">
          {currentStep === 1 ? (
            <Pressable onPress={handleFinish}>
              <SizableText size="$4" color="$color9">
                Passer
              </SizableText>
            </Pressable>
          ) : (
            <SizableText size="$4" color="$background">
              Passer
            </SizableText>
          )}
        </XStack>

        {/* Main content */}
        <YStack flex={1} justifyContent="center" alignItems="center" gap="$6">
          <SizableText size={96}>{step.emoji}</SizableText>
          <SizableText
            size="$9"
            fontWeight="800"
            color="$color12"
            textAlign="center"
          >
            {step.title}
          </SizableText>
          <SizableText
            size="$5"
            color="$color10"
            textAlign="center"
            lineHeight={24}
            maxWidth={300}
          >
            {step.body}
          </SizableText>
        </YStack>

        {/* Bottom: dots + button */}
        <YStack gap="$6" paddingBottom="$4">
          {/* Dot indicators */}
          <XStack justifyContent="center" gap="$3">
            {STEPS.map((_, index) => (
              <YStack
                key={index}
                width={index === currentStep ? 24 : 8}
                height={8}
                borderRadius="$4"
                backgroundColor={
                  index === currentStep ? '$color9' : '$color5'
                }
              />
            ))}
          </XStack>

          {/* Button */}
          <Button
            theme="active"
            size="$5"
            onPress={currentStep === STEPS.length - 1 ? handleFinish : handleNext}
          >
            {step.buttonLabel}
          </Button>
        </YStack>
      </YStack>
    </SafeArea>
  );
}
