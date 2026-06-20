/** Contextual help tips mapped by pathname prefix (longest match wins). */

const HELP_ENTRIES = [
  {
    prefix: "/dashboard",
    title: "Resumen",
    tips: [
      "KPIs semanales: leads nuevos, cambios de estado y tareas cerradas.",
      "El embudo muestra cuántos contactos hay en cada etapa.",
      "Los leads inactivos aparecen en el banner naranja — actúa antes de perderlos.",
    ],
  },
  {
    prefix: "/leads/import",
    title: "Importar leads",
    tips: [
      "CSV con columnas: name, email (obligatorios), company, phone, interest.",
      "Duplicados por email se omiten automáticamente.",
      "Solo managers y admins pueden importar.",
    ],
  },
  {
    prefix: "/leads",
    title: "Leads",
    tips: [
      "Filtra por estado, fuente o responsable desde la barra superior.",
      "Pulsa N o «Nuevo lead» para crear contactos manualmente.",
      "El score (caliente/tibio/frío) se calcula con las reglas en Admin > CRM.",
    ],
  },
  {
    prefix: "/pipeline",
    title: "Pipeline",
    tips: [
      "Arrastra tarjetas entre columnas para cambiar el estado del lead.",
      "Cada columna corresponde a una etapa del embudo comercial.",
      "Usa el valor del deal para priorizar oportunidades grandes.",
    ],
  },
  {
    prefix: "/tasks",
    title: "Tareas",
    tips: [
      "Las tareas vencidas se marcan en rojo; las de hoy en naranja.",
      "Asigna tareas a un miembro del equipo desde el detalle del lead.",
      "Las tareas recurrentes se regeneran al marcarlas como hechas.",
    ],
  },
  {
    prefix: "/calendar",
    title: "Calendario",
    tips: [
      "Muestra reuniones agendadas desde el chat web o citas manuales.",
      "Haz clic en un evento para ir al lead asociado.",
    ],
  },
  {
    prefix: "/presupuestos/nuevo",
    title: "Nuevo presupuesto",
    tips: [
      "Elige un pack base o añade líneas personalizadas.",
      "Los presupuestos > umbral requieren aprobación del admin.",
      "Comparte el enlace público para firma del cliente.",
    ],
  },
  {
    prefix: "/presupuestos",
    title: "Presupuestos",
    tips: [
      "Estados: borrador → pendiente → aprobado → enviado → aceptado.",
      "El PDF registra aperturas para saber si el cliente lo ha visto.",
      "Solo el admin puede aprobar presupuestos que lo requieran.",
    ],
  },
  {
    prefix: "/admin/users",
    title: "Equipo",
    tips: [
      "Roles: Admin (todo), Manager (CRM completo), Member (sus leads), Marketing (redes).",
      "Resetea contraseña o desactiva usuarios que ya no necesiten acceso.",
    ],
  },
  {
    prefix: "/admin/crm-settings",
    title: "Ajustes CRM",
    tips: [
      "Días de inactividad: cuándo alertar leads sin movimiento.",
      "Reglas de scoring: pondera fuente, encuesta y actividad reciente.",
    ],
  },
  {
    prefix: "/admin/security",
    title: "Seguridad",
    tips: [
      "Revisa sesiones activas en Admin → Seguridad.",
      "Revisa sesiones activas y revoca accesos sospechosos.",
    ],
  },
  {
    prefix: "/admin/audit",
    title: "Auditoría",
    tips: [
      "Registro de acciones sensibles: login, cambios de rol, aprobaciones.",
      "Filtra por usuario o tipo de acción.",
    ],
  },
  {
    prefix: "/marketing/pending",
    title: "Posts pendientes",
    tips: [
      "Posts en espera de aprobación del admin antes de publicarse.",
      "El admin recibe alerta si llevan más de 24 h sin revisar.",
    ],
  },
  {
    prefix: "/marketing/create",
    title: "Crear post",
    tips: [
      "Redacta el copy, adjunta media y elige plataforma.",
      "Envía a aprobación; el admin puede aprobar o rechazar con notas.",
    ],
  },
  {
    prefix: "/marketing/calendario",
    title: "Calendario editorial",
    tips: [
      "Vista semanal de posts programados y publicados.",
      "Arrastra para reprogramar fechas de publicación.",
    ],
  },
  {
    prefix: "/marketing/conexiones",
    title: "Conexiones",
    tips: [
      "Solo el admin puede conectar cuentas OAuth (TikTok, etc.).",
      "Tokens expirados requieren reconexión manual.",
    ],
  },
  {
    prefix: "/marketing",
    title: "Marketing",
    tips: [
      "Gestiona contenido para redes sociales desde un solo lugar.",
      "Flujo: borrador → pendiente → aprobado → programado → publicado.",
      "Métricas se sincronizan diariamente vía cron.",
    ],
  },
];

const DEFAULT_HELP = {
  title: "Ayuda",
  tips: [
    "Usa ⌘K para búsqueda global de leads y contactos.",
    "Pulsa ? para ver atajos de teclado (módulo comercial).",
    "El botón ? de la barra superior muestra ayuda de la sección actual.",
  ],
};

/** @param {string} pathname */
export function getHelpForPath(pathname) {
  if (!pathname) return DEFAULT_HELP;

  let best = null;
  for (const entry of HELP_ENTRIES) {
    if (
      pathname === entry.prefix ||
      pathname.startsWith(`${entry.prefix}/`)
    ) {
      if (!best || entry.prefix.length > best.prefix.length) {
        best = entry;
      }
    }
  }

  if (!best) return DEFAULT_HELP;
  return { title: best.title, tips: best.tips };
}
