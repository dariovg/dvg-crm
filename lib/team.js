/** Colores fijos por miembro del equipo (badge en pipeline/leads). */
export const TEAM_COLORS = [
  "#ff6b35",
  "#6366f1",
  "#22c55e",
  "#eab308",
  "#ec4899",
  "#14b8a6",
  "#8b5cf6",
  "#f43f5e",
];

export function teamColorForUser(user) {
  if (!user) return "#8b93a8";
  const key = user.id || user.email || "";
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TEAM_COLORS[Math.abs(hash) % TEAM_COLORS.length];
}

export function memberDisplayName(user) {
  if (!user) return "";
  if (user.name) return user.name.split(" ")[0];
  return (user.email || "").split("@")[0];
}
