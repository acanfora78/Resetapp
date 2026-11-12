import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';
import type { Edge } from 'react-native-safe-area-context';

import { makeStyles, spacing, useColors } from '@/theme';

interface Props {
  children: ReactNode;
  /** Contenuto fisso in basso (es. pulsante Continua). */
  footer?: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
}

/** Altezza del pulsante fisso in basso, usata per lasciare spazio in fondo allo scroll. */
const FOOTER_BUTTON_HEIGHT = 54;

export function Screen({ children, footer, scroll = true, edges = ['top', 'bottom'] }: Props) {
  const colors = useColors();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  // Con un pulsante fisso in basso, l'ultimo campo deve poter salire sopra di esso.
  const bottomSpace = footer ? FOOTER_BUTTON_HEIGHT + insets.bottom : 0;
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: spacing.lg + bottomSpace }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, styles.content]}>{children}</View>
        )}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) => ({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, paddingTop: spacing.sm, gap: spacing.sm },
}));
