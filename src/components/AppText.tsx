import { StyleSheet, Text } from 'react-native';
import type { TextProps } from 'react-native';

import { colors, fonts } from '@/theme';

type Variant = 'title' | 'heading' | 'body' | 'bodyMedium' | 'caption' | 'label';

interface Props extends TextProps {
  variant?: Variant;
  secondary?: boolean;
  center?: boolean;
  color?: string;
}

export function AppText({ variant = 'body', secondary, center, color, style, ...rest }: Props) {
  return (
    <Text
      {...rest}
      style={[
        styles[variant],
        secondary && { color: colors.textSecondary },
        center && { textAlign: 'center' },
        color ? { color } : null,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bold, fontSize: 30, lineHeight: 38, color: colors.text },
  heading: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 28, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: colors.text },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 24, color: colors.text },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  label: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.text },
});
