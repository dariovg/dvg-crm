"use client";

import { useState, useTransition } from "react";
import { telHref, whatsAppHref } from "@/lib/phone";
import { sendLeadEmail } from "@/app/actions";

export default function ContactQuickActions({ contact, mailEnabled }) {
  const tel = telHref(contact.phone);
  const wa = whatsAppHref(
    contact.phone,
    `Hola ${contact.name}, te escribo desde DVG Studio.`
  );
  const mailReady = mailEnabled !== false;

  const [emailOpen, setEmailOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState(null);
  const [pending, startTransition] = useTransition();

  function openEmail() {
    setEmailOpen(true);
    setMessage(null);
    if (!subject) setSubject(`Seguimiento — ${contact.name}`);
    if (!body) setBody(`Hola ${contact.name},\n\n`);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await sendLeadEmail(contact.id, { subject, body });
        if (result.ok) {
          setMessage({ type: "ok", text: "Email enviado y registrado en la línea de tiempo." });
          setSubject("");
          setBody("");
          setEmailOpen(false);
        } else {
          setMessage({ type: "err", text: result.error || "No se pudo enviar el email." });
        }
      } catch (err) {
        setMessage({ type: "err", text: err.message || "Error al enviar." });
      }
    });
  }

  return (
    <div className="quick-actions-bar">
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
        <button
          type="button"
          className="btn-quick btn-quick--mail"
          onClick={openEmail}
          disabled={!mailReady}
          title={mailReady ? "Enviar email desde CRM" : "SMTP no configurado"}
        >
          Email
        </button>
      </div>

      {emailOpen && (
        <form className="card contact-email-form" onSubmit={handleSubmit}>
          <h3>Enviar email</h3>
          <p className="contact-email-to">
            Para: <strong>{contact.email}</strong>
          </p>
          <div className="field">
            <label>Asunto</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Mensaje</label>
            <textarea
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>
          {message && (
            <p className={message.type === "ok" ? "form-success" : "form-error"}>
              {message.text}
            </p>
          )}
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={pending}>
              {pending ? "Enviando…" : "Enviar"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setEmailOpen(false)}
              disabled={pending}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
