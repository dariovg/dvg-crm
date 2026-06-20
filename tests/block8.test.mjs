import { test } from "node:test";
import assert from "node:assert/strict";
import { getHelpForPath } from "../lib/help-content.js";

test("getHelpForPath returns section-specific tips", () => {
  const leads = getHelpForPath("/leads");
  assert.equal(leads.title, "Leads");
  assert.ok(leads.tips.length >= 2);

  const importHelp = getHelpForPath("/leads/import");
  assert.equal(importHelp.title, "Importar leads");
  assert.notEqual(importHelp.title, leads.title);
});

test("getHelpForPath falls back for unknown routes", () => {
  const help = getHelpForPath("/unknown-route");
  assert.equal(help.title, "Ayuda");
  assert.ok(help.tips.length >= 1);
});

test("getHelpForPath matches marketing subroutes", () => {
  const pending = getHelpForPath("/marketing/pending");
  assert.equal(pending.title, "Posts pendientes");
});
