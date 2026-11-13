/**
 * Segnalazione degli errori (Sentry). Attiva solo se EXPO_PUBLIC_SENTRY_DSN è
 * impostata nelle variabili d'ambiente di EAS: senza, non parte nulla.
 *
 * Privacy: niente dati personali (nessun utente, email o indirizzo IP), niente
 * dati sul sonno; si inviano solo errore, schermata e dati tecnici del telefono.
 */
import * as Sentry from '@sentry/react-native';
import type { ComponentType } from 'react';
import { Platform } from 'react-native';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
const enabled = !!DSN && Platform.OS !== 'web';

/** Toglie i parametri dagli indirizzi delle richieste (es. date e filtri delle tabelle). */
const stripQuery = (url: unknown) => (typeof url === 'string' ? url.split('?')[0] : url);

export function initCrashReporting() {
  if (!enabled) return;
  Sentry.init({
    dsn: DSN,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    environment: __DEV__ ? 'development' : 'production',
    beforeSend(event) {
      delete event.user;
      if (event.request) {
        event.request.url = stripQuery(event.request.url) as string | undefined;
        delete event.request.data;
        delete event.request.query_string;
        delete event.request.cookies;
      }
      return event;
    },
    beforeBreadcrumb(crumb) {
      // I log della console possono contenere dati: non si inviano.
      if (crumb.category === 'console') return null;
      if (crumb.data && 'url' in crumb.data) crumb.data = { ...crumb.data, url: stripQuery(crumb.data.url) };
      return crumb;
    },
  });
}

/** Avvolge il componente principale per raccogliere gli errori (se attivo). */
export function withCrashReporting(C: ComponentType<Record<string, unknown>>): ComponentType<Record<string, unknown>> {
  return enabled ? Sentry.wrap(C) : C;
}
