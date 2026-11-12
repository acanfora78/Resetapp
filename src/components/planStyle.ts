import type { PlanItemKey } from '@/plan/types';

type Category = 'sleep' | 'light' | 'caffeine' | 'nap' | 'meal' | 'move' | 'safety';

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
  light_activity: 'move',
};

const STYLE: Record<Category, { icon: string; color: string }> = {
  sleep: { icon: '🌙', color: '#7B8CFF' },
  light: { icon: '☀️', color: '#FFB43A' },
  caffeine: { icon: '☕', color: '#C9925B' },
  nap: { icon: '😴', color: '#4FC3B8' },
  meal: { icon: '🍽️', color: '#FF8A3D' },
  move: { icon: '🚶', color: '#6BD48F' },
  safety: { icon: '🚗', color: '#FF6B6B' },
};

/** Icona e colore di un'azione del piano. */
export const planItemStyle = (key: PlanItemKey) => STYLE[CATEGORY[key]];
