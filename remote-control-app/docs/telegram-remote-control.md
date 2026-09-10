# Telegram Remote Control + Ollama

KAI STUDIO can run a small Telegram bot from its local Express backend so the owner can perform a limited set of desktop actions without exposing an inbound HTTP port.

## Safety model

Remote Control is intentionally **not** a remote shell.

- Telegram messages are accepted only from numeric user IDs configured in the **KAI Remote** app.
- Only private Telegram chats are processed.
- Supported desktop actions are fixed in source: status, lock, open a configured app alias, shutdown, and restart.
- `/open` can launch only aliases explicitly configured in Settings. It does not accept arbitrary command arguments.
- Shutdown/restart are disabled by default. When enabled, the bot still requires a one-time `/confirm <code>` within 60 seconds.
- Ollama only maps natural language to the same fixed action list. Model output is validated before execution.
- The Ollama URL is restricted to localhost.
- The Telegram bot token is stored separately from the public settings response.
- Remote settings API requests must originate from the local machine and a trusted client origin.

This design deliberately does not provide arbitrary CMD/PowerShell execution, file deletion, credential access, downloads, or persistence controls.

## Files written locally

The backend uses `KATA_STUDIO_HOME` (on Windows this normally resolves under `%LOCALAPPDATA%\KAI STUDIO`) for:

- `remote-control.json` — non-secret settings.
- `remote-control.env` — `TELEGRAM_BOT_TOKEN` only.
- `remote-control-audit.log` — JSONL audit events without message bodies or the bot token.

Do not commit these files.

## Setup

1. Create a Telegram bot with BotFather and copy its token.
2. Get your own numeric Telegram user ID.
3. Install and open the standalone **KAI Remote** app.
4. Paste the bot token and add your Telegram user ID to the allowlist.
5. Optionally add application aliases, one per line:

   ```text
   chrome=C:\Program Files\Google\Chrome\Application\chrome.exe
   notepad=notepad.exe
   ```

6. If Ollama should understand natural-language messages:
   - enable **Use Ollama for natural-language commands**;
   - keep the base URL local, normally `http://127.0.0.1:11434`;
   - enter a model that is already installed in Ollama.
7. Save Remote settings and verify that the status badge shows the bot username/running state.

## Telegram commands

```text
/help
/status
/lock
/open chrome
/shutdown
/restart
/confirm 123456
/cancel
```

`/shutdown` and `/restart` work only when power actions are explicitly enabled.

If Ollama is enabled, messages such as `mở chrome` or `máy đang dùng bao nhiêu RAM?` are classified into the same whitelist. Unsupported requests are rejected rather than converted into shell commands.

## Troubleshooting

### Bot token is valid but status is stopped

Check internet access to `api.telegram.org` and inspect the error shown in KAI Remote. Saving settings restarts the polling service.

### Ollama natural-language command fails

Confirm the configured model exists locally and Ollama is serving its HTTP API on the configured localhost URL. Slash commands continue to work without Ollama.

### `/open` fails

Use a full executable path or an executable available on the backend process `PATH`. Arguments are intentionally not accepted.

### Power action does not run

Power actions are Windows-only in this implementation, are disabled by default, and require the confirmation code issued by the bot.
