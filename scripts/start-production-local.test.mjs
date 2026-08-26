import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createProductionCommands,
  isApiHealthy,
} from "./start-production-local.mjs";

describe("production local startup", () => {
  it("reuses a healthy backend instead of starting a duplicate", () => {
    const commands = createProductionCommands(true);

    assert.deepEqual(commands.map(({ name }) => name), ["web"]);
  });

  it("starts both the API and web servers when the backend is unavailable", () => {
    const commands = createProductionCommands(false);

    assert.deepEqual(commands.map(({ name }) => name), ["api", "web"]);
  });

  it("treats a successful health response as healthy", async () => {
    const healthy = await isApiHealthy("http://localhost:5050/api/health", async () => ({ ok: true }));

    assert.equal(healthy, true);
  });

  it("treats a failed health request as unavailable", async () => {
    const healthy = await isApiHealthy("http://localhost:5050/api/health", async () => {
      throw new Error("connection refused");
    });

    assert.equal(healthy, false);
  });
});
