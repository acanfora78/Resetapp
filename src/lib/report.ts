import { endOfMonth, format, startOfMonth } from 'date-fns';
import { it as itLocale } from 'date-fns/locale';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import it from '@/i18n/it';
import { formatDebt } from '@/plan/sleepDebt';
import { monthlySummary } from '@/plan/report';
import { capitalizeFirst } from '@/plan/time';

import type { ProfileRow } from './database.types';
import { loadStreak } from './streak';
import { supabase } from './supabase';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const hours = (min: number | null) => (min === null ? '–' : it.onboarding.habits.hours(Math.round(min / 15) * 15).replace(' ore', ' h'));

/** Crea il report del mese in PDF e apre il foglio di condivisione. */
export async function shareMonthlyReport(profile: ProfileRow, month = new Date()) {
  const from = format(startOfMonth(month), 'yyyy-MM-dd');
  const to = format(endOfMonth(month), 'yyyy-MM-dd');
  const [logs, scores, streak] = await Promise.all([
    supabase.from('sleep_logs').select('data, minuti_dormiti, energia').gte('data', from).lte('data', to),
    supabase.from('daily_scores').select('data, punteggio').gte('data', from).lte('data', to),
    loadStreak(profile).catch(() => 0),
  ]);
  if (logs.error) throw logs.error;
  if (scores.error) throw scores.error;

  const s = monthlySummary({
    month,
    needMin: profile.fabbisogno_sonno_min,
    sleep: (logs.data ?? []).map((l) => ({ data: l.data, minutes: l.minuti_dormiti, energy: l.energia })),
    scores: (scores.data ?? []).map((r) => ({ data: r.data, score: r.punteggio })),
    streak,
  });
  const t = it.report;
  const monthLabel = capitalizeFirst(format(month, 'LLLL yyyy', { locale: itLocale }));
  const rows: [string, string][] = [
    [t.nights, String(s.nightsLogged)],
    [t.avgSleep, hours(s.avgSleepMin)],
    [t.underNeed, String(s.nightsUnderNeed)],
    [t.avgEnergy, s.avgEnergy === null ? '–' : `${String(s.avgEnergy).replace('.', ',')}/5`],
    [t.avgScore, s.avgScore === null ? '–' : `${s.avgScore}/100`],
    [t.bestScore, s.bestScore === null ? '–' : `${s.bestScore}/100`],
    [t.streak, String(s.streak)],
  ];
  const debtNote =
    s.avgSleepMin !== null && s.avgSleepMin < profile.fabbisogno_sonno_min
      ? t.debtNote(formatDebt(profile.fabbisogno_sonno_min - s.avgSleepMin))
      : t.okNote;

  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><style>
    body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#0B1838;margin:40px}
    h1{font-size:28px;margin:0}h2{font-size:16px;color:#FF9318;margin:4px 0 24px;font-weight:600}
    table{width:100%;border-collapse:collapse;margin-top:12px}td{padding:12px 8px;border-bottom:1px solid #E3E7F1;font-size:15px}
    td:last-child{text-align:right;font-weight:700}.note{margin-top:24px;font-size:14px}
    .foot{margin-top:40px;font-size:11px;color:#5C6C94}
  </style></head><body>
    <h1>Reset · ${esc(t.title)}</h1>
    <h2>${esc(monthLabel)}${profile.nome ? ` · ${esc(profile.nome)}` : ''}</h2>
    <table>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>
    <p class="note">${esc(debtNote)}</p>
    <p class="foot">${esc(t.disclaimer)}</p>
  </body></html>`;

  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: t.title });
}
