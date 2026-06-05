import { beforeEach, describe, expect, it, vi } from "vitest";

const ACCESS_TOKEN_STORAGE_KEY = "auth:accessToken";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function importAuth() {
  vi.resetModules();
  return import("./auth");
}

describe("auth profile cache", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("reuses a recently loaded profile for the same access token", async () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, "access-token");
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      profile: {
        id: "user-1",
        full_name: "Owner",
        email: "owner@example.com",
        role: "admin",
      },
    }));
    vi.stubGlobal("fetch", fetchMock);

    const { getCurrentProfile } = await importAuth();

    const firstProfile = await getCurrentProfile();
    const secondProfile = await getCurrentProfile();

    expect(firstProfile).toEqual(secondProfile);
    expect(secondProfile.role).toBe("owner_admin");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("clears the cached profile when auth tokens are cleared", async () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, "access-token");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ profile: { id: "user-1", role: "admin" } }))
      .mockResolvedValueOnce(jsonResponse({ profile: { id: "user-2", role: "admin" } }));
    vi.stubGlobal("fetch", fetchMock);

    const { clearAuthTokens, getCurrentProfile } = await importAuth();

    await expect(getCurrentProfile()).resolves.toMatchObject({ id: "user-1" });
    clearAuthTokens();
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, "access-token");
    await expect(getCurrentProfile()).resolves.toMatchObject({ id: "user-2" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
