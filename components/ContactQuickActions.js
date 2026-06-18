import { telHref, whatsAppHref } from "@/lib/phone";

export default function ContactQuickActions({ contact }) {
  const tel = telHref(contact.phone);
  const wa = whatsAppHref(
    contact.phone,
    `Hola ${contact.name}, te escribo desde DVG Studio.`
  );

  return (
    <div className="quick-actions">
      {tel && (
        <a href={tel} className="btn-quick btn-quick--tel">
          Llamar
        </a>
      )}
      {wa && (
        <a href={wa} target="_blank" rel="noreferrer" className="btn-quick btn-quick--wa">
          WhatsApp
        </a>
      )}
      <a href={`mailto:${contact.email}`} className="btn-quick btn-quick--mail">
        Email
      </a>
    </div>
  );
}
