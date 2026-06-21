import { test, mock } from "node:test";
import assert from "node:assert/strict";

const prismaMock = {
  notification: {
    create: mock.fn(async (args) => ({ id: "n1", ...args.data })),
  },
  user: {
    findMany: mock.fn(async () => [{ id: "admin1" }, { id: "admin2" }]),
  },
};

mock.module("../lib/prisma.js", {
  namedExports: { prisma: prismaMock },
});

const {
  pushNotification,
  notifyAssignee,
  notifyAdminsMarketingPending,
} = await import("../lib/notifications.js");

test("pushNotification crea registro para usuario válido", async () => {
  prismaMock.notification.create.mock.resetCalls();
  await pushNotification("user-1", {
    type: "task_assigned",
    title: "Tarea",
    body: "Seguimiento",
    link: "/tasks",
  });
  assert.equal(prismaMock.notification.create.mock.callCount(), 1);
  const arg = prismaMock.notification.create.mock.calls[0].arguments[0];
  assert.equal(arg.data.userId, "user-1");
  assert.equal(arg.data.link, "/tasks");
});

test("pushNotification ignora env-admin y userId vacío", async () => {
  prismaMock.notification.create.mock.resetCalls();
  await pushNotification("env-admin", { type: "x", title: "x" });
  await pushNotification(null, { type: "x", title: "x" });
  assert.equal(prismaMock.notification.create.mock.callCount(), 0);
});

test("notifyAssignee salta cuando actor es el mismo assignee", async () => {
  prismaMock.notification.create.mock.resetCalls();
  await notifyAssignee("u1", { id: "u1" }, {
    type: "task",
    title: "Mi tarea",
    link: "/tasks",
  });
  assert.equal(prismaMock.notification.create.mock.callCount(), 0);
});

test("notifyAssignee notifica a otro usuario", async () => {
  prismaMock.notification.create.mock.resetCalls();
  await notifyAssignee("actor", { id: "assignee" }, {
    type: "lead",
    title: "Acme",
    link: "/leads/1",
  });
  assert.equal(prismaMock.notification.create.mock.callCount(), 1);
  assert.equal(
    prismaMock.notification.create.mock.calls[0].arguments[0].data.type,
    "lead_assigned"
  );
});

test("notifyAdminsMarketingPending notifica a todos los admin", async () => {
  prismaMock.notification.create.mock.resetCalls();
  prismaMock.user.findMany.mock.resetCalls();
  await notifyAdminsMarketingPending({
    platform: "TWITTER",
    content: "Hola mundo desde el CRM",
  });
  assert.equal(prismaMock.user.findMany.mock.callCount(), 1);
  assert.equal(prismaMock.notification.create.mock.callCount(), 2);
  assert.equal(
    prismaMock.notification.create.mock.calls[0].arguments[0].data.link,
    "/marketing/pending"
  );
});
