import type { PlanItem } from '@/plan/types';

import it from './it';

/** Titolo e spiegazione di un'azione, scelta in base al tipo di giornata. */
export function planText(item: Pick<PlanItem, 'key' | 'context' | 'label'>): { title: string; why: string } {
  const t: { title: string; why: string; whyBy?: Partial<Record<string, string>> } = it.plan.items[item.key];
  return { title: item.label ?? t.title, why: t.whyBy?.[item.context] ?? t.why };
}
