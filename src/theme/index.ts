import { createContext, createElement, useContext } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';

import type { ShiftCode } from '@/plan/types';

import { dayPalette } from './palettes';
import type { Palette } from './palettes';

export { dayPalette, nightPalette } from './palettes';
export type { Palette } from './palettes';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

const PaletteContext = createContext<Palette>(dayPalette);

/** Fornisce la palette attiva (giorno o notte) a tutta l'app. */
export function PaletteProvider({ palette, children }: { palette: Palette; children: ReactNode }) {
  return createElement(PaletteContext.Provider, { value: palette }, children);
}

/** Colori del tema attivo. */
export const useColors = (): Palette => useContext(PaletteContext);

/**
 * Stili che dipendono dal tema: `const useStyles = makeStyles((colors) => ({ ... }))`,
 * poi nel componente `const styles = useStyles()`. Gli stili sono calcolati una volta per palette.
 */
export function makeStyles<T extends NamedStyles<T>>(
  factory: (colors: Palette) => T | NamedStyles<T>,
) {
  const cache = new Map<Palette, T>();
  return function useStyles(): T {
    const colors = useColors();
    let styles = cache.get(colors);
    if (!styles) {
      styles = StyleSheet.create(factory(colors) as T);
      cache.set(colors, styles);
    }
    return styles;
  };
}

/** Gradiente dell'accento per la palette data. */
export const accentGradientOf = (c: Palette) => [c.accentStart, c.accentEnd] as const;

/** Emoji mostrate nei badge dei turni al posto delle lettere. */
export const shiftEmoji: Record<ShiftCode, string> = {
  M: '🌅',
  P: '🌇',
  N: '🌙',
  G: '☀️',
  S: '😴',
  R: '🛋️',
};

export const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 8, md: 14, lg: 20, pill: 999 } as const;
