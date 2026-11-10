import { StyleSheet, View } from 'react-native';

import it from '@/i18n/it';

import { AppText } from './AppText';
import { Screen } from './Screen';

/** Schermata vuota con il titolo, per le sezioni non ancora sviluppate. */
export function TabPlaceholder({ title }: { title: string }) {
  return (
    <Screen edges={['top']}>
      <AppText variant="title">{title}</AppText>
      <View style={styles.center}>
        <AppText secondary center>
          {it.placeholder.comingSoon}
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
