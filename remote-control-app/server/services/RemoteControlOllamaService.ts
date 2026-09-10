import type { RemoteControlConfig, RemoteControlIntent } from "../models/RemoteControl";

const OLLAMA_TIMEOUT_MS = 20_000;
const ALLOWED_ACTIONS = new Set([
  "help",
  "status",
  "lock",
  "open_app",
  "shutdown",
  "restart",
  "cancel",
  "unknown",
]);

export async function resolveRemoteControlIntent(
  text: string,
  config: RemoteControlConfig,
): Promise<RemoteControlIntent> {
  if (!config.ollamaEnabled || !config.ollamaModel) {
    return { action: "unknown" };
  }

  const aliases = Object.keys(config.appAliases);
  const response = await fetch(`${config.ollamaBaseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS),
    body: JSON.stringify({
      model: config.ollamaModel,
      stream: false,
      format: "json",
      messages: [
        {
          role: "system",
          content: [
            "You classify a user's request into one safe local desktop action.",
            "Return JSON only: {\"action\":\"...\",\"alias\":\"...\"}.",
            "Allowed actions: help, status, lock, open_app, shutdown, restart, cancel, unknown.",
            `Allowed app aliases: ${aliases.length ? aliases.join(", ") : "(none)"}.`,
            "Never invent an alias. Never return shell, terminal, file, network, credential, download, delete, or arbitrary command actions.",
            "If the request is outside the allowed actions, return unknown.",
          ].join("\n"),
        },
        { role: "user", content: text.slice(0, 500) },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama HTTP ${response.status}`);
  }

  const data = await response.json() as { message?: { content?: string } };
  return parseRemoteControlIntent(data.message?.content || "");
}

export function parseRemoteControlIntent(raw: string): RemoteControlIntent {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { action: "unknown" };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { action: "unknown" };
  }

  const record = parsed as Record<string, unknown>;
  const action = typeof record.action === "string" ? record.action : "unknown";
  if (!ALLOWED_ACTIONS.has(action)) return { action: "unknown" };

  const alias = typeof record.alias === "string" ? record.alias.trim().toLowerCase() : undefined;
  return {
    action: action as RemoteControlIntent["action"],
    ...(alias ? { alias } : {}),
  };
}
