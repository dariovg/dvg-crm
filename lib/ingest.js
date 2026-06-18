import { prisma } from "./prisma";
import { pickRoundRobinAssignee } from "./round-robin";
import { pushNotification } from "./notifications";

export function cleanPhone(phone) {
  const p = String(phone || "").replace(/\s/g, "").trim();
  return p.length >= 6 ? p : null;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export async function upsertContactFromLead({
  name,
  email,
  company,
  phone,
  interest,
  source = "WEB_CHAT",
  eventType = "lead_created",
  eventSummary,
  payload,
}) {
  const mail = normalizeEmail(email);
  if (!mail || !name) throw new Error("name and email required");
  const phoneClean = cleanPhone(phone);

  let contact = await prisma.contact.findFirst({
    where: { email: mail },
    orderBy: { createdAt: "desc" },
  });

  if (!contact) {
    const assigneeId = await pickRoundRobinAssignee();
    contact = await prisma.contact.create({
      data: {
        name: String(name).trim(),
        email: mail,
        company: company || null,
        phone: phoneClean,
        interest: interest || null,
        source,
        status: "NEW",
        assigneeId,
      },
    });
    if (assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId },
        select: { id: true, name: true, email: true },
      });
      await pushNotification(assigneeId, {
        type: "lead_assigned",
        title: "Nuevo lead web",
        body: `${contact.name} — asignación automática`,
        link: `/leads/${contact.id}`,
      });
      await prisma.contactEvent.create({
        data: {
          contactId: contact.id,
          type: "assigned",
          summary: `Round-robin → ${assignee?.name || assignee?.email}`,
        },
      });
    }
    await prisma.contactEvent.create({
      data: {
        contactId: contact.id,
        type: eventType,
        summary: eventSummary || "Lead registrado desde la web",
        payload: payload || undefined,
      },
    });
  } else {
    contact = await prisma.contact.update({
      where: { id: contact.id },
      data: {
        name: String(name).trim(),
        company: company || contact.company,
        phone: phoneClean || contact.phone,
        interest: interest || contact.interest,
      },
    });
    await prisma.contactEvent.create({
      data: {
        contactId: contact.id,
        type: "duplicate_detected",
        summary: `Lead duplicado desde web (${source}) — email ya registrado`,
        payload: payload || undefined,
      },
    });
    await prisma.contactEvent.create({
      data: {
        contactId: contact.id,
        type: eventType,
        summary: eventSummary || "Actividad desde la web (email existente)",
        payload: payload || undefined,
      },
    });
  }

  return contact;
}

export async function recordBooking({
  name,
  email,
  phone,
  company,
  date,
  time,
  meetUrl,
  notes,
  interest,
}) {
  const phoneClean = cleanPhone(phone);
  const contact = await upsertContactFromLead({
    name,
    email,
    company,
    phone: phoneClean,
    interest,
    source: "BOOKING",
    eventType: "meeting_booked",
    eventSummary: `Cita agendada: ${date} ${time}`,
    payload: { date, time, meetUrl, notes },
  });

  await prisma.contact.update({
    where: { id: contact.id },
    data: { status: "MEETING_SCHEDULED", phone: phoneClean || contact.phone },
  });

  await prisma.meeting.create({
    data: {
      contactId: contact.id,
      date,
      time,
      meetUrl: meetUrl || null,
      notes: notes || null,
    },
  });

  return contact;
}

export async function recordSurvey({ name, email, answers, score }) {
  const mail = email ? normalizeEmail(email) : null;
  let contact = null;

  if (mail) {
    contact = await prisma.contact.findFirst({
      where: { email: mail },
      orderBy: { createdAt: "desc" },
    });
    if (!contact && name) {
      contact = await prisma.contact.create({
        data: {
          name: String(name).trim(),
          email: mail,
          source: "SURVEY",
          status: "NEW",
          leadScore: score ?? null,
        },
      });
      await prisma.contactEvent.create({
        data: {
          contactId: contact.id,
          type: "survey_completed",
          summary: "Encuesta de madurez digital completada",
          payload: { score },
        },
      });
    } else if (contact) {
      await prisma.contact.update({
        where: { id: contact.id },
        data: { leadScore: score ?? contact.leadScore },
      });
      await prisma.contactEvent.create({
        data: {
          contactId: contact.id,
          type: "survey_completed",
          summary: "Encuesta de madurez digital completada",
          payload: { score },
        },
      });
    }
  }

  await prisma.surveyResponse.create({
    data: {
      contactId: contact?.id || null,
      email: mail,
      name: name || null,
      answers,
      score: score ?? null,
    },
  });

  return contact;
}

export function verifyIngestSecret(req) {
  const expected = process.env.CRM_INGEST_SECRET || "";
  if (!expected) return false;
  const got =
    req.headers.get("x-crm-ingest-secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return got === expected;
}
