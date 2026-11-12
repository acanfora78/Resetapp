import type { ShiftCode } from '@/plan/types';

export interface Palette {
  isNight: boolean;
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  inputBorder: string;
  accentSoft: string;
  disabledBg: string;
  disabledText: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentStart: string;
  accentEnd: string;
  onAccent: string;
  danger: string;
  /** Interruttore spento: traccia e pallino. */
  switchOffTrack: string;
  switchOffThumb: string;
  switchOnThumb: string;
  shift: Record<ShiftCode, string>;
}

/** Tema normale: blu notte del brand e arancio. */
export const dayPalette: Palette = {
  isNight: false,
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
  textMuted: 'rgba(255,255,255,0.55)',
  accent: '#FFA529',
  accentStart: '#FFB43A',
  accentEnd: '#FF9318',
  onAccent: '#0B1838',
  danger: '#FF6B6B',
  switchOffTrack: '#2A3A66',
  switchOffThumb: '#C9D1E6',
  switchOnThumb: '#FFFFFF',
  shift: { M: '#FFB43A', P: '#FF8A3D', N: '#7B8CFF', G: '#FFD25E', S: '#4FC3B8', R: '#5C6C94' },
};

/**
 * Modalità notte: sfondo quasi nero, ambra tenue, testo bianco caldo.
 * Contrasto del testo almeno AA (4,5:1) su sfondo e superfici; nessun bianco puro grande.
 */
export const nightPalette: Palette = {
  isNight: true,
  background: '#05091A',
  surface: '#0B1430',
  surfaceAlt: '#16224A',
  border: 'rgba(242,230,216,0.10)',
  inputBorder: 'rgba(242,230,216,0.18)',
  accentSoft: 'rgba(232,163,61,0.14)',
  disabledBg: '#121B3A',
  disabledText: 'rgba(242,230,216,0.5)',
  text: 'rgba(242,230,216,0.85)',
  textSecondary: 'rgba(242,230,216,0.74)',
  textMuted: 'rgba(242,230,216,0.6)',
  accent: '#E8A33D',
  accentStart: '#E8A33D',
  accentEnd: '#D98E2B',
  onAccent: '#05091A',
  danger: '#E07A6E',
  switchOffTrack: '#22305A',
  switchOffThumb: '#A9B2C8',
  switchOnThumb: '#F2E6D8',
  shift: { M: '#D9A045', P: '#D27A3E', N: '#6E7CD6', G: '#D9B656', S: '#4AA89F', R: '#4E5C80' },
};
