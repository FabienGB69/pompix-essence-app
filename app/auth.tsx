import React, { useState } from 'react';
import { LoginScreen, SizableText, toast, H2 } from '@blinkdotnew/mobile-ui';
import { blink } from '@/lib/blink';
import { useRouter } from 'expo-router';
import { BlinkAuthError } from '@blinkdotnew/sdk';

export default function AuthScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // First try to sign in
      try {
        await blink.auth.signInWithEmail(email, password);
        toast('Connexion réussie', { variant: 'success' });
        router.replace('/(tabs)');
      } catch (error: any) {
        // If user not found, try to sign up
        if (error instanceof BlinkAuthError && error.message.includes('Invalid credentials')) {
          await blink.auth.signUp({ email, password });
          toast('Compte créé avec succès', { variant: 'success' });
          router.replace('/(tabs)');
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      toast('Erreur', { message: error.message, variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginScreen
      variant="editorial"
      title="Bienvenue sur Pompix"
      subtitle="Connectez-vous pour sauvegarder vos favoris et alertes."
      logo={<H2 fontWeight="800" color="$color9">✦ Pompix</H2>}
      showEmailForm
      onEmailSubmit={handleEmailSubmit}
      onTerms={() => {}}
      onPrivacy={() => {}}
      footerSlot={
        <SizableText size="$2" color="$color9" textAlign="center">
          En continuant, vous acceptez nos conditions d'utilisation.
        </SizableText>
      }
    />
  );
}
