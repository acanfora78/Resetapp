import type { ShiftCode } from '@/plan/types';

export const colors = {
  background: '#0B1838',
  surface: '#132451',
  surfaceAlt: '#1B2F63',
  border: 'rgba(255,255,255,0.12)',
  inputBorder: 'rgba(255,255,255,0.15)',
  accentSoft: 'rgba(255,165,41,0.12)',
  disabledBg: '#1C2B55',
  disabledText: 'rgba(255,255,255,0.4)',
  text: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.68)',
  textMuted: 'rgba(255,255,255,0.45)',
  accent: '#FFA529',
  accentStart: '#FFB43A',
  accentEnd: '#FF9318',
  onAccent: '#0B1838',
  danger: '#FF6B6B',
} as const;

export const accentGradient = [colors.accentStart, colors.accentEnd] as const;

export const shiftColors: Record<ShiftCode, string> = {
  M: '#FFB43A',
  P: '#FF8A3D',
  N: '#7B8CFF',
  G: '#FFD25E',
  S: '#4FC3B8',
  R: '#5C6C94',
};

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
