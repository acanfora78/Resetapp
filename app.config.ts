import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Configurazione dinamica: estende app.json.
 * Il plugin di Google Sign-In richiede l'URL scheme iOS, che si ricava
 * dall'ID client iOS di Google (variabile d'ambiente). Finché la variabile
 * non è impostata il plugin non viene aggiunto e il pulsante Google
 * mostra un messaggio "non ancora configurato".
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const plugins = [...(config.plugins ?? [])];

  if (iosClientId && iosClientId.endsWith('.apps.googleusercontent.com')) {
    const iosUrlScheme =
      'com.googleusercontent.apps.' + iosClientId.replace('.apps.googleusercontent.com', '');
    plugins.push(['@react-native-google-signin/google-signin', { iosUrlScheme }]);
  }

  return {
    ...config,
    name: config.name ?? 'Reset',
    slug: config.slug ?? 'reset',
    plugins,
  };
};
