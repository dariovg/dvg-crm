export function scoreLabel(score) {
  if (score == null) return null;
  if (score >= 75) return { label: "Alto", className: "score-hot" };
  if (score >= 45) return { label: "Medio", className: "score-warm" };
  return { label: "Bajo", className: "score-cold" };
}
