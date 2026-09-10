import { createServer } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRemoteApp } from "../server/remoteApp";

const servers: ReturnType<typeof createServer>[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
});

describe("KAI Remote standalone server", () => {
  it("exposes a loopback health endpoint without the KAI STUDIO backend", async () => {
    const service = {
      getStatus: () => ({ running: false, botUsername: "", lastError: "", lastUpdateAt: "" }),
      restart: vi.fn(),
    };
    const server = createServer(createRemoteApp(service));
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected an ephemeral TCP port");

    const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, service: "kai-remote" });
  });

  it("does not expose unrelated KAI STUDIO API routes", async () => {
    const service = {
      getStatus: () => ({ running: false, botUsername: "", lastError: "", lastUpdateAt: "" }),
      restart: vi.fn(),
    };
    const server = createServer(createRemoteApp(service));
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected an ephemeral TCP port");

    const response = await fetch(`http://127.0.0.1:${address.port}/api/youtube`);

    expect(response.status).toBe(404);
  });
});
