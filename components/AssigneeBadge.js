import { memberDisplayName, teamColorForUser } from "@/lib/team";

export default function AssigneeBadge({ user, className = "" }) {
  if (!user) return null;
  const color = teamColorForUser(user);
  const label = memberDisplayName(user);
  return (
    <span
      className={`assignee-badge ${className}`}
      style={{ "--member-color": color }}
      title={user.email}
    >
      {label}
    </span>
  );
}
