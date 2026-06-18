import { prisma } from "./prisma";

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

  let contact = await prisma.contact.findFirst({
    where: { email: mail },
    orderBy: { createdAt: "desc" },
  });

  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        name: String(name).trim(),
        email: mail,
        company: company || null,
        phone: phone || null,
        interest: interest || null,
        source,
        status: "NEW",
      },
    });
  } else {
    contact = await prisma.contact.update({
      where: { id: contact.id },
      data: {
        name: String(name).trim(),
        company: company || contact.company,
        phone: phone || contact.phone,
        interest: interest || contact.interest,
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
  const contact = await upsertContactFromLead({
    name,
    email,
    company,
    phone,
    interest,
    source: "BOOKING",
    eventType: "meeting_booked",
    eventSummary: `Cita agendada: ${date} ${time}`,
    payload: { date, time, meetUrl, notes },
  });

  await prisma.contact.update({
    where: { id: contact.id },
    data: { status: "MEETING_SCHEDULED", phone: phone || contact.phone },
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
