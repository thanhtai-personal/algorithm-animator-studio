#!/usr/bin/env node
/**
 * Creates a SOURCE REVIEW archive only, NEVER a GitHub release.
 * git archive HEAD has no .git directory/history/refs. It does NOT make the
 * existing public GitHub repository's historical objects disappear.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
const root = process.cwd();
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).trim();
const head = git("rev-parse", "HEAD");
if (git("status", "--porcelain", "--untracked-files=no")) {
  console.error("Refusing source snapshot: tracked workspace is dirty.");
  process.exit(1);
}
const tracked = git("ls-tree", "-r", "--name-only", "HEAD").split("\n");
const forbidden = tracked.filter(p => /(?:^|\/)(credentials\.json|\.env|\.npmrc|.*\.(?:p12|pfx|jks|keystore|pem|onnx|safetensors|pt|pth|ckpt)|tiktokvt.*\.txt)$/i.test(p)
  && p !== ".env.example");
if (forbidden.length) {
  console.error(`Refusing source snapshot: ${forbidden.length} potential secret/model paths tracked.`);
  process.exit(1);
}
for (const required of ["LICENSE", "SECURITY.md", "THIRD_PARTY_NOTICES.md", "docs/oss/RELEASE_STATUS.md"]) {
  if (!tracked.includes(required)) throw new Error(`Missing required source file: ${required}`);
}
const dir = path.join(root, "artifacts", "oss-release-review");
fs.mkdirSync(dir, { recursive: true });
const basename = `algorithm-animator-studio-review-${head.slice(0, 12)}`;
const output = path.join(dir, basename + ".zip");
git("archive", "--format=zip", `--prefix=${basename}/`, `--output=${output}`, "HEAD");
const digest = crypto.createHash("sha256").update(fs.readFileSync(output)).digest("hex");
const metadata = {
  status: "REVIEW ONLY - NOT A RELEASE",
  commit: head, filename: path.basename(output), sha256: digest,
  warnings: [
    "No Git history is present INSIDE this source snapshot, but older data remains accessible via the original public repository.",
    "Official publication is blocked until private history audit, license review, real builds and owner signoff.",
  ],
};
fs.writeFileSync(path.join(dir, basename + ".json"), JSON.stringify(metadata, null, 2) + "\n");
console.log(JSON.stringify(metadata, null, 2));
