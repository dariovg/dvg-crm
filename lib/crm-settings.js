import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import { DEFAULT_SCORING_RULES } from "./lead-score";

const INACTIVITY_KEY = "crm.inactivity_days";
const SCORING_KEY = "crm.scoring_rules";

export const DEFAULT_INACTIVITY_DAYS = 7;

const getInactivityDaysCached = unstable_cache(
  async () => {
    const row = await prisma.appSetting.findUnique({ where: { key: INACTIVITY_KEY } });
    const n = parseInt(row?.value || "", 10);
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_INACTIVITY_DAYS;
  },
  ["crm-inactivity-days"],
  { revalidate: 300, tags: ["crm-settings"] }
);

const getScoringRulesCached = unstable_cache(
  async () => {
    const row = await prisma.appSetting.findUnique({ where: { key: SCORING_KEY } });
    if (!row?.value) return { ...DEFAULT_SCORING_RULES };
    try {
      const parsed = JSON.parse(row.value);
      return { ...DEFAULT_SCORING_RULES, ...parsed };
    } catch {
      return { ...DEFAULT_SCORING_RULES };
    }
  },
  ["crm-scoring-rules"],
  { revalidate: 300, tags: ["crm-settings"] }
);

export async function getInactivityDays() {
  return getInactivityDaysCached();
}

export async function getScoringRules() {
  return getScoringRulesCached();
}

export async function getCrmSettings() {
  const [inactivityDays, scoringRules] = await Promise.all([
    getInactivityDays(),
    getScoringRules(),
  ]);
  return { inactivityDays, scoringRules };
}

export async function saveCrmSettings({ inactivityDays, scoringRules }) {
  const days = parseInt(String(inactivityDays), 10);
  if (!Number.isFinite(days) || days < 1) {
    throw new Error("Días de inactividad no válidos");
  }
  await prisma.appSetting.upsert({
    where: { key: INACTIVITY_KEY },
    update: { value: String(days) },
    create: { key: INACTIVITY_KEY, value: String(days) },
  });
  if (scoringRules) {
    await prisma.appSetting.upsert({
      where: { key: SCORING_KEY },
      update: { value: JSON.stringify(scoringRules) },
      create: { key: SCORING_KEY, value: JSON.stringify(scoringRules) },
    });
  }
}
