import type { PlanItemKey } from '@/plan/types';

type Category = 'sleep' | 'light' | 'caffeine' | 'nap' | 'meal' | 'move' | 'safety' | 'event' | 'habit' | 'organize';

const CATEGORY: Record<PlanItemKey, Category> = {
  wake: 'light',
  wake_bright_light: 'light',
  wake_morning_light: 'light',
  bedtime: 'sleep',
  low_light: 'sleep',
  caffeine_stop: 'caffeine',
  nap_short: 'nap',
  shift_break: 'meal',
  nap_pre_night: 'nap',
  night_bright_light: 'light',
  night_caffeine_stop: 'caffeine',
  night_light_meal: 'meal',
  drive_alert: 'safety',
  post_night_routine: 'sleep',
  day_sleep: 'sleep',
  short_sleep: 'sleep',
  natural_light: 'light',
  light_walk: 'move',
  movement: 'move',
  screen_off: 'habit',
  main_meal: 'meal',
  prepare_evening: 'organize',
  prepare_room: 'organize',
  alcohol_tip: 'habit',
  event: 'event',
  event_nap: 'nap',
  event_caffeine: 'caffeine',
};

const STYLE: Record<Category, { icon: string; color: string }> = {
  sleep: { icon: '🌙', color: '#7B8CFF' },
  light: { icon: '☀️', color: '#FFB43A' },
  caffeine: { icon: '☕', color: '#C9925B' },
  nap: { icon: '😴', color: '#4FC3B8' },
  meal: { icon: '🍽️', color: '#FF8A3D' },
  move: { icon: '🚶', color: '#6BD48F' },
  safety: { icon: '🚗', color: '#FF6B6B' },
  event: { icon: '🎉', color: '#C58BFF' },
  habit: { icon: '📵', color: '#9AA6C7' },
  organize: { icon: '🎒', color: '#E0B26B' },
};

/** Icone dedicate, al posto di quella della categoria. */
const ICON: Partial<Record<PlanItemKey, string>> = {
  screen_off: '📵',
  main_meal: '🍽️',
  prepare_evening: '🎒',
  prepare_room: '🛏️',
  movement: '🏃',
  light_walk: '🚶',
  alcohol_tip: '🍷',
};

/** Icona e colore di un'azione del piano. */
export const planItemStyle = (key: PlanItemKey) => {
  const s = STYLE[CATEGORY[key]];
  return ICON[key] ? { ...s, icon: ICON[key]! } : s;
};
