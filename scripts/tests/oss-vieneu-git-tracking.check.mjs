import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { trackedFilesUnder } from "./helpers/oss-tracked-source.mjs";

test("VieNeu local ignored files do not count as vendored source; committed files do", () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "oss-vieneu-tracking-"));
  try {
    execFileSync("git", ["-C", repo, "init", "-q"], { stdio: "pipe", windowsHide: true });
    const relative = "libs/VieNeu-TTS/src/vieneu/assets/voices.json";
    const fullPath = path.join(repo, ...relative.split("/"));
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(path.join(repo, ".gitignore"), "libs/VieNeu-TTS/\n");
    fs.writeFileSync(fullPath, '{"fixture":true}\n');

    assert.deepEqual(trackedFilesUnder(repo, "libs/VieNeu-TTS"), [],
      "local ignored VieNeu source must be allowed without blocking OSS checks");
    execFileSync("git", ["-C", repo, "add", "-f", "--", relative], {
      stdio: "pipe", windowsHide: true,
    });
    assert.deepEqual(trackedFilesUnder(repo, "libs/VieNeu-TTS"), [relative],
      "Git-indexed VieNeu voice assets must be detected even when gitignored");
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test("Electron verifier does not require or bundle a local VieNeu SDK", () => {
  const source = fs.readFileSync(
    new URL("../../scripts/verify-electron-build.mjs", import.meta.url), "utf8",
  );
  assert.doesNotMatch(source, /^\s*"libs\/VieNeu-TTS\/pyproject\.toml",?$/m);
  assert.doesNotMatch(source, /^\s*\["libs\/VieNeu-TTS",/m);
  assert.match(source, /Do not bundle optional TTS weights or VieNeu SDK/);
});
