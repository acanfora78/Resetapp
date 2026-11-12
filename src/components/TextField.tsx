import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

import { colors, fonts, radius } from '@/theme';

import { AppText } from './AppText';

interface Props extends TextInputProps {
  label?: string;
  hint?: string;
}

export function TextField({ label, hint, style, onFocus, onBlur, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      {label ? <AppText variant="label">{label}</AppText> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.accent}
        keyboardAppearance="dark"
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[styles.input, focused && styles.focused, style]}
      />
      {hint ? <AppText variant="caption">{hint}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  focused: { borderColor: colors.accent },
});
