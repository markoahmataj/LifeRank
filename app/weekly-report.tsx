// app/weekly-report.tsx
// Weekly report screen. Compiles a real report from the recent logbook window;
// falls back to the screen's gated empty state until there is enough history.

import { useRouter } from 'expo-router';
import { WeeklyReportScreen } from '@/src/screens/WeeklyReportScreen';
import { useApp } from '@/src/store/AppContext';
import { getTier, categories, CATEGORY_ORDER } from '@/src/design-system/tokens';
import type { CategoryId, LogbookEntry, WeeklyReport } from '@/src/design-system/types';

function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  return 1 + Math.round(
    ((date.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7,
  );
}

/** Build a weekly report from the most recent logbook entries (real data only).
 *  Returns undefined when there is too little history, so the screen shows its
 *  own "report not ready" empty state. */
function buildWeeklyReport(logbook: LogbookEntry[]): WeeklyReport | undefined {
  if (logbook.length < 2) return undefined;

  // Logbook is newest-first; the most recent 7 entries form the cycle window.
  const windowEntries = logbook.slice(0, 7);
  const newest = windowEntries[0];
  const oldest = windowEntries[windowEntries.length - 1];

  const endScore = newest.lifeScore;
  const startScore = oldest.lifeScore;
  const delta = +(endScore - startScore).toFixed(1);

  const catDelta = (id: CategoryId): number => {
    const newV = newest.categoryScores.find(c => c.id === id)?.value ?? 0;
    const oldV = oldest.categoryScores.find(c => c.id === id)?.value ?? 0;
    return +(newV - oldV).toFixed(1);
  };
  const ranked = [...CATEGORY_ORDER].sort((a, b) => catDelta(b) - catDelta(a));
  const strongest = ranked[0];
  const weakest = ranked[ranked.length - 1];

  const completedMissions = windowEntries.reduce(
    (n, e) => n + (e.completedMissionIds?.length ?? 0), 0,
  );
  const missedCheckIns = Math.max(0, 7 - windowEntries.length);

  const rankStability: WeeklyReport['rankStability'] =
    delta > 0.2 ? 'rising' : delta < -0.2 ? 'falling' : 'holding';

  const now = new Date();
  return {
    weekNumber: isoWeek(now),
    year: now.getUTCFullYear(),
    startDate: oldest.date,
    endDate: newest.date,
    startScore,
    endScore,
    delta,
    strongest,
    weakest,
    completedMissions,
    missedCheckIns,
    rankStability,
    recommendedFocus: weakest,
    narrative:
      `${categories[strongest].name} moved most this cycle ` +
      `(${catDelta(strongest) >= 0 ? '+' : ''}${catDelta(strongest).toFixed(1)}). ` +
      `${categories[weakest].name} is the slowest pillar — compound it next cycle.`,
  };
}

export default function WeeklyReportRoute() {
  const router = useRouter();
  const { state } = useApp();
  const tier = getTier(state.score.tier);

  const report = buildWeeklyReport(state.logbook);

  return (
    <WeeklyReportScreen
      tier={tier}
      report={report}
      onBack={() => router.back()}
      onShare={() => router.push('/(tabs)/share')}
    />
  );
}
