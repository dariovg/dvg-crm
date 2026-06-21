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
      "El score (caliente/tibio/frío) se calcula con las reglas en Admin > Ajustes comercial.",
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
      "Citas con leads agendadas desde la web.",
      "Tareas con fecha de vencimiento en la semana.",
      "Eventos de equipo (formación, novedades): Admin/Manager pueden crear con «+ Nuevo evento».",
      "El equipo recibe alerta al crear el evento y un recordatorio ~24 h antes.",
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
      "Roles: Admin (todo), Manager (acceso comercial completo), Member (sus leads), Marketing (redes).",
      "Resetea contraseña o desactiva usuarios que ya no necesiten acceso.",
    ],
  },
  {
    prefix: "/admin/crm-settings",
    title: "Ajustes comercial",
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

const HELP_ENTRIES_EN = [
  {
    prefix: "/dashboard",
    title: "Overview",
    tips: [
      "Weekly KPIs: new leads, status changes and closed tasks.",
      "The funnel shows how many contacts are in each stage.",
      "Inactive leads appear in the orange banner — act before you lose them.",
    ],
  },
  {
    prefix: "/leads/import",
    title: "Import leads",
    tips: [
      "CSV columns: name, email (required), company, phone, interest.",
      "Duplicates by email are skipped automatically.",
      "Only managers and admins can import.",
    ],
  },
  {
    prefix: "/leads",
    title: "Leads",
    tips: [
      "Filter by status, source or assignee from the top bar.",
      "Press N or «New lead» to create contacts manually.",
      "Score (hot/warm/cold) is calculated with rules in Admin > Commercial settings.",
    ],
  },
  {
    prefix: "/pipeline",
    title: "Pipeline",
    tips: [
      "Drag cards between columns to change lead status.",
      "Each column matches a sales funnel stage.",
      "Use deal value to prioritize large opportunities.",
    ],
  },
  {
    prefix: "/tasks",
    title: "Tasks",
    tips: [
      "Overdue tasks are red; today's tasks are orange.",
      "Assign tasks to a team member from the lead detail page.",
      "Recurring tasks regenerate when marked done.",
    ],
  },
  {
    prefix: "/calendar",
    title: "Calendar",
    tips: [
      "Shows meetings booked from the web chat or manual appointments.",
      "Click an event to open the related lead.",
    ],
  },
  {
    prefix: "/presupuestos/nuevo",
    title: "New quote",
    tips: [
      "Pick a base pack or add custom line items.",
      "Quotes above the threshold require admin approval.",
      "Share the public link for client signature.",
    ],
  },
  {
    prefix: "/presupuestos",
    title: "Quotes",
    tips: [
      "Statuses: draft → pending → approved → sent → accepted.",
      "The PDF tracks opens so you know if the client viewed it.",
      "Only the admin can approve quotes that require it.",
    ],
  },
  {
    prefix: "/admin/users",
    title: "Team",
    tips: [
      "Roles: Admin (all), Manager (full commercial access), Member (own leads), Marketing (social).",
      "Reset passwords or deactivate users who no longer need access.",
    ],
  },
  {
    prefix: "/admin/crm-settings",
    title: "Commercial settings",
    tips: [
      "Inactivity days: when to alert leads with no activity.",
      "Scoring rules: weight source, survey and recent activity.",
    ],
  },
  {
    prefix: "/admin/security",
    title: "Security",
    tips: [
      "Review active sessions in Admin → Security.",
      "Revoke suspicious sessions.",
    ],
  },
  {
    prefix: "/admin/audit",
    title: "Audit",
    tips: [
      "Log of sensitive actions: login, role changes, approvals.",
      "Filter by user or action type.",
    ],
  },
  {
    prefix: "/marketing/pending",
    title: "Pending posts",
    tips: [
      "Posts waiting for admin approval before publishing.",
      "Admin gets an alert if they sit unreviewed for 24+ hours.",
    ],
  },
  {
    prefix: "/marketing/create",
    title: "Create post",
    tips: [
      "Write copy, attach media and choose platform.",
      "Submit for approval; admin can approve or reject with notes.",
    ],
  },
  {
    prefix: "/marketing/calendario",
    title: "Editorial calendar",
    tips: [
      "Weekly view of scheduled and published posts.",
      "Drag to reschedule publication dates.",
    ],
  },
  {
    prefix: "/marketing/conexiones",
    title: "Connections",
    tips: [
      "Only admin can connect OAuth accounts (TikTok, etc.).",
      "Expired tokens need manual reconnection.",
    ],
  },
  {
    prefix: "/marketing",
    title: "Marketing",
    tips: [
      "Manage social content from one place.",
      "Flow: draft → pending → approved → scheduled → published.",
      "Metrics sync daily via cron.",
    ],
  },
];

const DEFAULT_HELP_ES = {
  title: "Ayuda",
  tips: [
    "Usa ⌘K para búsqueda global de leads y contactos.",
    "Pulsa ? para ver atajos de teclado (módulo comercial).",
    "El botón ? de la barra superior muestra ayuda de la sección actual.",
  ],
};

const DEFAULT_HELP_EN = {
  title: "Help",
  tips: [
    "Use ⌘K for global lead and contact search.",
    "Press ? for keyboard shortcuts (sales module).",
    "The ? button in the top bar shows help for the current section.",
  ],
};

function matchHelp(pathname, entries) {
  let best = null;
  for (const entry of entries) {
    if (pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`)) {
      if (!best || entry.prefix.length > best.prefix.length) best = entry;
    }
  }
  return best;
}

/** @param {string} pathname @param {"es"|"en"} [locale] */
export function getHelpForPath(pathname, locale = "es") {
  if (!pathname) {
    return locale === "en" ? DEFAULT_HELP_EN : DEFAULT_HELP_ES;
  }

  const entries = locale === "en" ? HELP_ENTRIES_EN : HELP_ENTRIES;
  const best = matchHelp(pathname, entries);
  if (!best) return locale === "en" ? DEFAULT_HELP_EN : DEFAULT_HELP_ES;
  return { title: best.title, tips: best.tips };
}
