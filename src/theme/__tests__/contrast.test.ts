import { dayPalette, nightPalette } from '../palettes';
import type { Palette } from '../palettes';

type RGBA = [number, number, number, number];

function parse(c: string): RGBA {
  if (c.startsWith('#')) {
    const h = c.slice(1);
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
  }
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (!m) throw new Error(`Colore non valido: ${c}`);
  const [r, g, b, a = '1'] = m[1]!.split(',').map((x) => x.trim());
  return [Number(r), Number(g), Number(b), Number(a)];
}

/** Colore risultante di `fg` (anche trasparente) sopra `bg` opaco. */
function blend(fg: string, bg: string): [number, number, number] {
  const [r, g, b, a] = parse(fg);
  const [br, bgG, bb] = parse(bg);
  return [r * a + br * (1 - a), g * a + bgG * (1 - a), b * a + bb * (1 - a)];
}

function luminance([r, g, b]: [number, number, number]) {
  const ch = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

function contrast(fg: string, bg: string) {
  const l1 = luminance(blend(fg, bg));
  const l2 = luminance(blend(bg, bg));
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

const AA = 4.5;

describe.each([
  ['modalità notte', nightPalette],
  ['tema normale', dayPalette],
] as [string, Palette][])('Contrasto testi (%s)', (_name, p) => {
  const backgrounds = { background: p.background, surface: p.surface, surfaceAlt: p.surfaceAlt };
  for (const fgKey of ['text', 'textSecondary', 'textMuted', 'accent'] as const) {
    for (const [bgKey, bg] of Object.entries(backgrounds)) {
      it(`${fgKey} su ${bgKey} ≥ AA`, () => {
        expect(contrast(p[fgKey], bg)).toBeGreaterThanOrEqual(AA);
      });
    }
  }
  it('testo sui pulsanti pieni ≥ AA', () => {
    expect(contrast(p.onAccent, p.accentStart)).toBeGreaterThanOrEqual(AA);
    expect(contrast(p.onAccent, p.accentEnd)).toBeGreaterThanOrEqual(AA);
  });
  it('testo dei pulsanti disattivati leggibile (≥ 3:1, testo grande)', () => {
    expect(contrast(p.disabledText, p.disabledBg)).toBeGreaterThanOrEqual(3);
  });
});
