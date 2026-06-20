import { getLastActivityDate } from "./activity-utils";

export const DEFAULT_SCORING_RULES = {
  source: { WEB_CHAT: 10, BOOKING: 25, SURVEY: 15, MANUAL: 5 },
  status: {
    NEW: 5,
    CONTACTED: 15,
    MEETING_SCHEDULED: 25,
    MEETING_DONE: 30,
    PROPOSAL: 35,
    NEGOTIATION: 40,
    WON: 50,
    LOST: 0,
  },
  hasQuote: 20,
  hasMeeting: 15,
  recentActivityBonus: 15,
  staleActivityPenalty: 10,
  recentActivityDays: 7,
  staleActivityDays: 14,
  surveyScoreWeight: 0.4,
};

export function scoreLabel(score) {
  if (score == null) return null;
  if (score >= 75) return { label: "Alto", className: "score-hot" };
  if (score >= 45) return { label: "Medio", className: "score-warm" };
  return { label: "Bajo", className: "score-cold" };
}

/**
 * @param {import("@prisma/client").Contact & {
 *   quotes?: unknown[];
 *   meetings?: unknown[];
 *   surveys?: Array<{ score?: number | null }>;
 *   events?: Array<{ createdAt: Date }>;
 *   tasks?: Array<{ updatedAt: Date }>;
 * }} contact
 */
export function computeLeadScore(contact, rules = DEFAULT_SCORING_RULES) {
  let score = 0;
  score += rules.source?.[contact.source] ?? 0;
  score += rules.status?.[contact.status] ?? 0;

  if (contact.quotes?.length) score += rules.hasQuote ?? 0;
  if (contact.meetings?.length) score += rules.hasMeeting ?? 0;

  const lastSurvey = contact.surveys?.[0];
  if (lastSurvey?.score != null) {
    score += Math.round(lastSurvey.score * (rules.surveyScoreWeight ?? 0));
  }

  const lastAt = getLastActivityDate(contact);
  if (lastAt) {
    const daysSince = (Date.now() - lastAt.getTime()) / 86400000;
    if (daysSince <= (rules.recentActivityDays ?? 7)) {
      score += rules.recentActivityBonus ?? 0;
    } else if (daysSince >= (rules.staleActivityDays ?? 14)) {
      score -= rules.staleActivityPenalty ?? 0;
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/** @param {Array<object>} contacts */
export function withLeadScores(contacts, rules = DEFAULT_SCORING_RULES) {
  return contacts.map((c) => ({
    ...c,
    leadScore: computeLeadScore(c, rules),
  }));
}
