import { scoreLabel } from "@/lib/lead-score";

export default function LeadScoreBadge({ score }) {
  const meta = scoreLabel(score);
  if (!meta) return null;
  return (
    <span className={`lead-score-badge ${meta.className}`} title={`Score: ${score}`}>
      {meta.label} · {score}
    </span>
  );
}
