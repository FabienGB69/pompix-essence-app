import React, { useState } from 'react';
import { LoginScreen, SizableText, toast, H2 } from '@blinkdotnew/mobile-ui';
import { blink } from '@/lib/blink';
import { useRouter } from 'expo-router';

const AUTH_ERROR_NAME = 'BlinkAuthError';

type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_VERIFIED'
  | 'EMAIL_ALREADY_EXISTS'
  | 'WEAK_PASSWORD';

function getErrorMessage(code: AuthErrorCode): string {
  switch (code) {
    case 'INVALID_CREDENTIALS':
      return 'Email ou mot de passe incorrect.';
    case 'EMAIL_NOT_VERIFIED':
      return "Veuillez vérifier votre email d'abord.";
    case 'EMAIL_ALREADY_EXISTS':
      return 'Un compte avec cet email existe déjà. Connectez-vous.';
    case 'WEAK_PASSWORD':
      return 'Mot de passe trop court (6 caractères minimum).';
    default:
      return 'Une erreur est survenue. Veuillez réessayer.';
  }
}

export default function AuthScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Step 1: Try to sign in first
      try {
        await blink.auth.signInWithEmail(email, password);
        toast('Connexion réussie', { variant: 'success' });
        router.replace('/(tabs)');
        return;
      } catch (signInError: any) {
        // Step 3: Email not verified — tell user and send verification
        if (
          signInError?.name === AUTH_ERROR_NAME &&
          signInError?.code === 'EMAIL_NOT_VERIFIED'
        ) {
          toast('Email non vérifié', {
            message: getErrorMessage('EMAIL_NOT_VERIFIED'),
            variant: 'error',
          });
          await blink.auth.sendEmailVerification();
          return;
        }

        // Step 2: Invalid credentials — user might not exist, try signUp
        if (
          signInError?.name === AUTH_ERROR_NAME &&
          signInError?.code === 'INVALID_CREDENTIALS'
        ) {
          try {
            await blink.auth.signUp({ email, password });
            toast('Compte créé avec succès', { variant: 'success' });
            router.replace('/(tabs)');
            return;
          } catch (signUpError: any) {
            if (
              signUpError?.name === AUTH_ERROR_NAME
            ) {
              const code = signUpError.code as AuthErrorCode;
              if (
                code === 'EMAIL_ALREADY_EXISTS' ||
                code === 'WEAK_PASSWORD'
              ) {
                toast('Erreur', {
                  message: getErrorMessage(code),
                  variant: 'error',
                });
                return;
              }
            }
            // Unknown signUp error — show raw message
            toast('Erreur', {
              message: signUpError?.message || getErrorMessage('INVALID_CREDENTIALS'),
              variant: 'error',
            });
            return;
          }
        }

        // Any other signIn error
        toast('Erreur', {
          message: signInError?.message || getErrorMessage('INVALID_CREDENTIALS'),
          variant: 'error',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginScreen
      variant="editorial"
      title="Bienvenue sur Pompix"
      subtitle="Trouvez le carburant le moins cher près de chez vous."
      logo={<H2 fontWeight="800" color="$color9">⛽ Pompix</H2>}
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
