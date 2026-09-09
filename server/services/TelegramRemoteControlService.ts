import { randomInt } from "node:crypto";
import {
  appendRemoteControlAudit,
  readRemoteControlConfig,
  readTelegramBotToken,
} from "./RemoteControlConfigService";
import { executeRemoteControlAction } from "./RemoteControlActionService";
import { resolveRemoteControlIntent } from "./RemoteControlOllamaService";
import {
  getTelegramBotIdentity,
  getTelegramUpdates,
  sendTelegramMessage,
  type TelegramUpdate,
} from "./TelegramBotClient";
import type {
  RemoteControlConfig,
  RemoteControlIntent,
  RemoteControlRuntimeStatus,
} from "../models/RemoteControl";

type PendingPowerAction = {
  action: "shutdown" | "restart";
  code: string;
  expiresAt: number;
};

type ActionContext = {
  token: string;
  chatId: number;
  userId: string;
  config: RemoteControlConfig;
};

const TELEGRAM_LONG_POLL_SECONDS = 25;
const CONFIRMATION_TTL_MS = 60_000;

export class TelegramRemoteControlService {
  private pollingAbortController: AbortController | null = null;
  private pollingPromise: Promise<void> | null = null;
  private pendingPowerActions = new Map<string, PendingPowerAction>();
  private runtimeStatus: RemoteControlRuntimeStatus = {
    running: false,
    botUsername: "",
    lastError: "",
    lastUpdateAt: "",
  };

  getStatus(): RemoteControlRuntimeStatus {
    return { ...this.runtimeStatus };
  }

  async start() {
    await this.stop();

    const config = readRemoteControlConfig();
    const token = readTelegramBotToken();

    if (!config.enabled) {
      this.runtimeStatus = { ...this.runtimeStatus, running: false, lastError: "" };
      return;
    }
    if (!token) {
      this.runtimeStatus = {
        ...this.runtimeStatus,
        running: false,
        lastError: "Remote Control đang bật nhưng chưa có Telegram bot token.",
      };
      return;
    }

    try {
      const bot = await getTelegramBotIdentity(token);
      this.runtimeStatus = {
        running: true,
        botUsername: bot.username || "",
        lastError: "",
        lastUpdateAt: new Date().toISOString(),
      };

      const controller = new AbortController();
      this.pollingAbortController = controller;
      this.pollingPromise = this.poll(token, controller.signal).catch((error) => {
        if (controller.signal.aborted) return;
        this.markPollingError(error);
        console.error("[remote-control] Telegram polling stopped:", error);
      });
    } catch (error) {
      this.runtimeStatus = {
        running: false,
        botUsername: "",
        lastError: toErrorMessage(error),
        lastUpdateAt: new Date().toISOString(),
      };
      throw error;
    }
  }

  async stop() {
    this.pollingAbortController?.abort();
    const previousPolling = this.pollingPromise;

    this.pollingAbortController = null;
    this.pollingPromise = null;
    this.pendingPowerActions.clear();
    this.runtimeStatus = { ...this.runtimeStatus, running: false };

    if (previousPolling) await previousPolling.catch(() => undefined);
  }

  async restart() {
    await this.stop();
    await this.start();
  }

  private async poll(token: string, signal: AbortSignal) {
    let offset = 0;

    while (!signal.aborted) {
      try {
        const updates = await getTelegramUpdates(token, offset, TELEGRAM_LONG_POLL_SECONDS, signal);

        for (const update of updates) {
          offset = Math.max(offset, update.update_id + 1);
          await this.handleUpdate(token, update);
        }

        this.runtimeStatus = {
          ...this.runtimeStatus,
          running: true,
          lastError: "",
          lastUpdateAt: new Date().toISOString(),
        };
      } catch (error) {
        if (signal.aborted) return;
        this.markPollingError(error);
        console.warn("[remote-control] Telegram poll error:", toErrorMessage(error));
        await delay(2_000, signal);
      }
    }
  }

  private markPollingError(error: unknown) {
    this.runtimeStatus = {
      ...this.runtimeStatus,
      lastError: toErrorMessage(error),
      lastUpdateAt: new Date().toISOString(),
    };
  }

  private async handleUpdate(token: string, update: TelegramUpdate) {
    const message = update.message;
    const text = message?.text?.trim();
    const userId = message?.from?.id ? String(message.from.id) : "";

    if (!message || !text || !userId || message.chat.type !== "private") return;

    const config = readRemoteControlConfig();
    if (!config.enabled) return;

    if (!config.allowedUserIds.includes(userId)) {
      appendRemoteControlAudit({
        event: "unauthorized_message",
        userId,
        chatId: String(message.chat.id),
      });
      return;
    }

    const context: ActionContext = { token, chatId: message.chat.id, userId, config };

    try {
      if (text.startsWith("/")) {
        await this.handleSlashCommand(text, context);
        return;
      }

      const intent = await resolveRemoteControlIntent(text, config);
      await this.handleIntent(intent, context);
    } catch (error) {
      const errorMessage = toErrorMessage(error);
      appendRemoteControlAudit({
        event: "handler_error",
        userId,
        chatId: String(message.chat.id),
        error: errorMessage,
      });
      await sendTelegramMessage(token, message.chat.id, `Không thực hiện được yêu cầu: ${errorMessage}`);
    }
  }

  private async handleSlashCommand(text: string, context: ActionContext) {
    const [rawCommand, ...args] = text.split(/\s+/);
    const command = rawCommand.toLowerCase().replace(/@[\w_]+$/, "");

    switch (command) {
      case "/start":
      case "/help":
        await sendTelegramMessage(context.token, context.chatId, buildHelpMessage(context.config));
        return;
      case "/status":
        await this.runAction({ action: "status" }, context);
        return;
      case "/lock":
        await this.runAction({ action: "lock" }, context);
        return;
      case "/open":
        await this.runAction({ action: "open_app", alias: args[0] }, context);
        return;
      case "/shutdown":
      case "/restart":
        await this.requestPowerConfirmation(command.slice(1) as "shutdown" | "restart", context);
        return;
      case "/confirm":
        await this.confirmPowerAction(args[0] || "", context);
        return;
      case "/cancel":
        await this.cancelPowerAction(context);
        return;
      default:
        await sendTelegramMessage(context.token, context.chatId, "Lệnh không hỗ trợ. Dùng /help để xem danh sách.");
    }
  }

  private async handleIntent(intent: RemoteControlIntent, context: ActionContext) {
    switch (intent.action) {
      case "help":
        await sendTelegramMessage(context.token, context.chatId, buildHelpMessage(context.config));
        return;
      case "status":
      case "lock":
      case "open_app":
        await this.runAction(intent, context);
        return;
      case "shutdown":
      case "restart":
        await this.requestPowerConfirmation(intent.action, context);
        return;
      case "cancel":
        await this.cancelPowerAction(context);
        return;
      default:
        await sendTelegramMessage(
          context.token,
          context.chatId,
          "Mình chỉ nhận các thao tác đã whitelist. Dùng /help để xem lệnh hỗ trợ.",
        );
    }
  }

  private async runAction(intent: RemoteControlIntent, context: ActionContext) {
    if (!["status", "lock", "open_app"].includes(intent.action)) return;

    try {
      const result = await executeRemoteControlAction(
        intent.action as "status" | "lock" | "open_app",
        context.config,
        intent.alias,
      );
      appendRemoteControlAudit({
        event: "action",
        userId: context.userId,
        chatId: String(context.chatId),
        action: intent.action,
        alias: intent.alias || "",
        ok: result.ok,
      });
      await sendTelegramMessage(context.token, context.chatId, result.message);
    } catch (error) {
      appendRemoteControlAudit({
        event: "action",
        userId: context.userId,
        chatId: String(context.chatId),
        action: intent.action,
        alias: intent.alias || "",
        ok: false,
        error: toErrorMessage(error),
      });
      throw error;
    }
  }

  private async requestPowerConfirmation(action: "shutdown" | "restart", context: ActionContext) {
    if (!context.config.allowPowerActions) {
      await sendTelegramMessage(context.token, context.chatId, "Shutdown/restart đang bị tắt trong Settings → Remote.");
      return;
    }

    const code = String(randomInt(100_000, 1_000_000));
    this.pendingPowerActions.set(pendingKey(context), {
      action,
      code,
      expiresAt: Date.now() + CONFIRMATION_TTL_MS,
    });

    appendRemoteControlAudit({
      event: "power_confirmation_requested",
      userId: context.userId,
      chatId: String(context.chatId),
      action,
    });
    await sendTelegramMessage(
      context.token,
      context.chatId,
      `Xác nhận ${action} bằng /confirm ${code} trong 60 giây. Dùng /cancel để hủy.`,
    );
  }

  private async confirmPowerAction(code: string, context: ActionContext) {
    const key = pendingKey(context);
    const pending = this.pendingPowerActions.get(key);

    if (!pending || pending.expiresAt < Date.now()) {
      this.pendingPowerActions.delete(key);
      await sendTelegramMessage(context.token, context.chatId, "Không có yêu cầu xác nhận còn hiệu lực.");
      return;
    }
    if (pending.code !== code.trim()) {
      await sendTelegramMessage(context.token, context.chatId, "Mã xác nhận không đúng.");
      return;
    }

    this.pendingPowerActions.delete(key);
    const latestConfig = readRemoteControlConfig();
    if (!latestConfig.allowPowerActions) {
      await sendTelegramMessage(context.token, context.chatId, "Power actions đã bị tắt trước khi xác nhận.");
      return;
    }

    const result = await executeRemoteControlAction(pending.action, latestConfig);
    appendRemoteControlAudit({
      event: "power_action",
      userId: context.userId,
      chatId: String(context.chatId),
      action: pending.action,
      ok: result.ok,
    });
    await sendTelegramMessage(context.token, context.chatId, result.message);
  }

  private async cancelPowerAction(context: ActionContext) {
    const removed = this.pendingPowerActions.delete(pendingKey(context));
    await sendTelegramMessage(
      context.token,
      context.chatId,
      removed ? "Đã hủy yêu cầu đang chờ xác nhận." : "Không có yêu cầu nào đang chờ xác nhận.",
    );
  }
}

function buildHelpMessage(config: RemoteControlConfig): string {
  const aliases = Object.keys(config.appAliases);
  return [
    "KAI Remote Control",
    "/status — trạng thái máy",
    "/lock — khóa Windows",
    aliases.length ? `/open <alias> — ${aliases.join(", ")}` : "/open <alias> — chưa có alias được cấu hình",
    "/shutdown — yêu cầu tắt máy (cần xác nhận, nếu được bật)",
    "/restart — yêu cầu restart (cần xác nhận, nếu được bật)",
    "/cancel — hủy yêu cầu power đang chờ",
    config.ollamaEnabled
      ? `Ollama (${config.ollamaModel}) đang bật cho câu lệnh tự nhiên.`
      : "Câu lệnh tự nhiên đang tắt; dùng slash commands.",
  ].join("\n");
}

function pendingKey(context: Pick<ActionContext, "chatId" | "userId">): string {
  return `${context.chatId}:${context.userId}`;
}

function delay(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (signal.aborted) return resolve();

    const onAbort = () => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    signal.addEventListener("abort", onAbort, { once: true });
  });
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Lỗi Remote Control không xác định.";
}
