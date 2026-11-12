import { AppText } from './AppText';
import { Screen } from './Screen';

/** Sezione non ancora sviluppata: solo il titolo, nessun testo segnaposto. */
export function TabPlaceholder({ title }: { title: string }) {
  return (
    <Screen edges={['top']}>
      <AppText variant="title">{title}</AppText>
    </Screen>
  );
}
