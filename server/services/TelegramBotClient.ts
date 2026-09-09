export type TelegramUser = {
  id: number;
  username?: string;
};

export type TelegramChat = {
  id: number;
  type: string;
};

export type TelegramMessage = {
  message_id: number;
  text?: string;
  from?: TelegramUser;
  chat: TelegramChat;
};

export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};

type TelegramApiResponse<T> = {
  ok: boolean;
  result?: T;
  description?: string;
};

export async function getTelegramBotIdentity(token: string): Promise<TelegramUser> {
  return telegramRequest<TelegramUser>(token, "getMe", {});
}

export async function getTelegramUpdates(
  token: string,
  offset: number,
  timeoutSeconds: number,
  signal: AbortSignal,
): Promise<TelegramUpdate[]> {
  return telegramRequest<TelegramUpdate[]>(token, "getUpdates", {
    offset,
    timeout: timeoutSeconds,
    allowed_updates: ["message"],
  }, signal);
}

export async function sendTelegramMessage(token: string, chatId: number, text: string) {
  await telegramRequest(token, "sendMessage", {
    chat_id: chatId,
    text: text.slice(0, 4000),
    disable_web_page_preview: true,
  });
}

async function telegramRequest<T>(
  token: string,
  method: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const data = await response.json() as TelegramApiResponse<T>;

  if (!response.ok || !data.ok || data.result === undefined) {
    throw new Error(data.description || `Telegram API ${response.status}`);
  }

  return data.result;
}
