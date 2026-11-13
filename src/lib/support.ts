import Constants from 'expo-constants';
import { Linking, Platform } from 'react-native';

import { APP } from '@/constants/app';
import it from '@/i18n/it';

export type SupportTopic = 'help' | 'bug';

/**
 * Email al supporto con oggetto e, in fondo, versione dell'app e del sistema
 * (nessun dato personale o sul sonno). Restituisce false se non c'è un'app email.
 */
export async function contactSupport(topic: SupportTopic): Promise<boolean> {
  const version = Constants.expoConfig?.version ?? '';
  const build = Constants.nativeBuildVersion ?? '';
  const footer = it.support.mailFooter(version, build, `${Platform.OS} ${String(Platform.Version)}`);
  const url =
    `mailto:${APP.SUPPORT_EMAIL}` +
    `?subject=${encodeURIComponent(it.support.subject[topic])}` +
    `&body=${encodeURIComponent(`${it.support.bodyStart[topic]}\n\n\n${footer}`)}`;
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
