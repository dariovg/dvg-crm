"use client";

import { useCallback, useState } from "react";
import { SocialPlatform } from "@prisma/client";
import { PublishForm } from "@/components/marketing/PublishForm";
import PostPreview from "@/components/marketing/PostPreview";
import SavedTemplates from "@/components/marketing/SavedTemplates";

const QUICK_TEMPLATES = [
  {
    label: "Tip IA para PYMEs",
    content:
      "💡 Tip del día: La IA no sustituye a tu equipo — libera horas en tareas repetitivas para que vendáis más.\n\n¿Qué proceso te gustaría automatizar primero?\n\n#IA #PYME #DVGStudio",
  },
  {
    label: "Caso de éxito (borrador)",
    content:
      "🚀 Ayudamos a negocios locales a digitalizarse con webs, CRM e IA a medida.\n\nSi tu empresa aún gestiona leads en Excel, hablemos.\n\n👉 dvgsstudio.com\n\n#TransformaciónDigital",
  },
  {
    label: "Pregunta engagement",
    content:
      "❓ Pregunta rápida para dueños de negocio:\n\n¿Cuántas horas a la semana pierdes en tareas que podrían automatizarse?\n\nTe leo en comentarios 👇",
  },
];

export default function CreateContentClient() {
  const [template, setTemplate] = useState<string | undefined>();
  const [templateKey, setTemplateKey] = useState(0);
  const [preview, setPreview] = useState({
    platform: "TWITTER" as SocialPlatform,
    content: "",
    imageUrl: "",
  });

  const handlePreviewChange = useCallback(
    (data: { platform: SocialPlatform; content: string; imageUrl: string }) => {
      setPreview(data);
    },
    []
  );

  const applyTemplate = useCallback((content: string) => {
    setTemplate(content);
    setTemplateKey((k) => k + 1);
  }, []);

  return (
    <>
      <section className="panel marketing-templates">
        <h2 className="panel-title">Plantillas rápidas</h2>
        <p className="muted" style={{ marginBottom: "0.75rem" }}>
          Empieza con una base y edítala para el post de hoy.
        </p>
        <div className="marketing-template-btns">
          {QUICK_TEMPLATES.map((t) => (
            <button
              key={t.label}
              type="button"
              className="btn btn-secondary"
              onClick={() => applyTemplate(t.content)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <SavedTemplates
        currentContent={preview.content}
        onSelect={applyTemplate}
      />

      <div className="marketing-create-grid">
        <PublishForm
          key={`${templateKey}-${template ?? "empty"}`}
          initialContent={template}
          onPreviewChange={handlePreviewChange}
        />
        <aside className="marketing-create-aside">
          <PostPreview
            platform={preview.platform}
            content={preview.content}
            imageUrl={preview.imageUrl}
          />
          <div className="panel marketing-tips">
          <h2 className="panel-title">Rutina diaria</h2>
          <ol className="marketing-daily-steps">
            <li>
              <strong>Crear</strong> — redacta o usa plantilla
            </li>
            <li>
              <strong>Revisar</strong> — en Pendientes (admin aprueba)
            </li>
            <li>
              <strong>Publicar</strong> — en Listo para publicar → X
            </li>
          </ol>
          <h3 className="panel-title" style={{ marginTop: "1.25rem" }}>
            Consejos
          </h3>
          <ul className="marketing-tips-list">
            <li>X: máximo 280 caracteres</li>
            <li>1 idea clara + 1 CTA + 2-3 hashtags</li>
            <li>Publicar entre 9–11 h entre semana</li>
          </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
