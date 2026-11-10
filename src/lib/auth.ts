import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

import it from '@/i18n/it';

import { env, isGoogleConfigured } from './env';
import { supabase } from './supabase';

export class AuthError extends Error {}

/** Errore che non va mostrato (es. l'utente ha annullato). */
export class AuthCancelled extends Error {}

function mapError(message: string | undefined): string {
  const m = (message ?? '').toLowerCase();
  if (m.includes('invalid login credentials')) return it.auth.errors.invalidCredentials;
  if (m.includes('email not confirmed')) return it.auth.errors.emailNotConfirmed;
  if (m.includes('already registered') || m.includes('already exists')) return it.auth.errors.userExists;
  return it.auth.errors.generic;
}

export function validateEmailPassword(email: string, password: string): string | null {
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return it.auth.errors.invalidEmail;
  if (password.length < 8) return it.auth.errors.shortPassword;
  return null;
}

/** Registrazione. Restituisce `needsConfirmation` se Supabase richiede la conferma dell'email. */
export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
  if (error) throw new AuthError(mapError(error.message));
  // Se l'email esiste già Supabase restituisce un utente senza identità.
  if (data.user && data.user.identities?.length === 0) throw new AuthError(it.auth.errors.userExists);
  return { needsConfirmation: !data.session };
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw new AuthError(mapError(error.message));
}

export async function isAppleAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  return AppleAuthentication.isAvailableAsync();
}

export async function signInWithApple() {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') throw new AuthCancelled();
    throw new AuthError(it.auth.errors.generic);
  }
  if (!credential.identityToken) throw new AuthError(it.auth.errors.generic);

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error) throw new AuthError(mapError(error.message));

  // Apple fornisce il nome solo al primo accesso: lo salviamo nel profilo.
  const given = credential.fullName?.givenName;
  if (given && data.user) {
    await supabase.from('profiles').update({ nome: given }).eq('id', data.user.id);
  }
}

let googleConfigured = false;

export async function signInWithGoogle() {
  if (!isGoogleConfigured) throw new AuthError(it.auth.errors.googleNotConfigured);
  // Import dinamico: il modulo nativo esiste solo nelle development/production build.
  const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
  if (!googleConfigured) {
    GoogleSignin.configure({
      iosClientId: env.googleIosClientId,
      webClientId: env.googleWebClientId,
    });
    googleConfigured = true;
  }

  let idToken: string | null = null;
  try {
    if (Platform.OS === 'android') await GoogleSignin.hasPlayServices();
    const res = await GoogleSignin.signIn();
    if (res.type === 'cancelled') throw new AuthCancelled();
    idToken = res.data.idToken;
  } catch (e) {
    if (e instanceof AuthCancelled) throw e;
    if ((e as { code?: string }).code === 'SIGN_IN_CANCELLED') throw new AuthCancelled();
    throw new AuthError(it.auth.errors.generic);
  }
  if (!idToken) throw new AuthError(it.auth.errors.generic);

  const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
  if (error) throw new AuthError(mapError(error.message));
}

export async function signOut() {
  await supabase.auth.signOut();
  if (isGoogleConfigured) {
    try {
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      await GoogleSignin.signOut();
    } catch {
      // ignorato: l'utente potrebbe non aver usato Google
    }
  }
}
