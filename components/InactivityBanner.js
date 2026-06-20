import Link from "next/link";

export default function InactivityBanner({ leads, thresholdDays }) {
  if (!leads?.length) return null;

  return (
    <div className="reminder-banner reminder-banner--inactivity">
      <span>
        <strong>{leads.length}</strong> lead{leads.length !== 1 ? "s" : ""} sin
        actividad ({thresholdDays}+ días)
      </span>
      <ul className="inactivity-list">
        {leads.slice(0, 5).map((lead) => (
          <li key={lead.id}>
            <Link href={`/leads/${lead.id}`}>
              {lead.name}
            </Link>
            <span className="inactivity-days">{lead.daysSince} d</span>
          </li>
        ))}
      </ul>
      {leads.length > 5 && (
        <Link href="/leads?status=NEW" className="reminder-banner-link">
          Ver leads →
        </Link>
      )}
    </div>
  );
}
