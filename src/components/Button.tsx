import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, View } from 'react-native';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { accentGradientOf, fonts, makeStyles, radius, useColors } from '@/theme';

import { AppText } from './AppText';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({ title, onPress, variant = 'primary', disabled, loading, icon, style }: Props) {
  const colors = useColors();
  const styles = useStyles();
  const isDisabled = disabled || loading;
  const textColor = isDisabled
    ? colors.disabledText
    : variant === 'primary'
      ? colors.onAccent
      : variant === 'danger'
        ? colors.danger
        : colors.text;

  const content = (
    <View style={styles.inner}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.onAccent : colors.text} />
      ) : (
        <>
          {icon}
          <AppText style={[styles.text, { color: textColor }]}>{title}</AppText>
        </>
      )}
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.secondary,
        isDisabled && variant !== 'ghost' && styles.disabled,
        { opacity: pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {variant === 'primary' && !isDisabled ? (
        <LinearGradient
          colors={accentGradientOf(colors)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  base: { borderRadius: radius.pill, overflow: 'hidden', minHeight: 54 },
  gradient: { flex: 1, justifyContent: 'center' },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  /** Stile unico per i pulsanti disattivati in tutta l'app. */
  disabled: { backgroundColor: colors.disabledBg, borderColor: colors.disabledBg, justifyContent: 'center' },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  text: { fontFamily: fonts.semibold, fontSize: 16 },
}));
