#!/usr/bin/env node
/**
 * Offline, read-only audit of ALL local Git refs and all reachable historical paths.
 * Never print secret values. Detailed scanner output remains local under /artifacts.
 * Not a substitute for GitHub PR/release cache review or independent rights review.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const outputDir = path.join(root, "artifacts", "oss-history-audit");
fs.mkdirSync(outputDir, { recursive: true });

function exec(command, args, maxBuffer = 128 * 1024 * 1024) {
  return spawnSync(command, args, { cwd: root, encoding: "utf8", maxBuffer, windowsHide: true });
}
function git(args) {
  const result = exec("git", args);
  if (result.error || result.status !== 0) {
    console.error("Git history audit requires a complete Git checkout. Command:", args[0]);
    process.exit(2);
  }
  return result.stdout.trim();
}

const shallow = git(["rev-parse", "--is-shallow-repository"]) === "true";
const refs = git(["for-each-ref", "--format=%(refname)"]).split("\n").filter(Boolean);
const pullRefs = refs.filter(name => name.startsWith("refs/pull/") || name.startsWith("refs/audit/pull/"));
const objects = git(["rev-list", "--objects", "--all"]).split("\n").filter(Boolean);
const suspects = new Map();

const rules = {
  unverifiedMedia: /(?:^|\/)(?:src\/assets\/sprites\/|src\/assets\/audios\/|src\/assets\/marble-|haaland\.jpg$|public\/preset-assets\/)/i,
  voiceModels: /\.(?:onnx|pt|pth|safetensors|ckpt)(?:\.json)?$/i,
  credentialPaths: /(?:^|\/)(?:credentials\.json|\.env(?:\.|$)|\.npmrc$|id_rsa|id_ed25519|.*\.(?:pem|key|p12|pfx|keystore))$/i,
  sensitiveData: /(?:^|\/)(?:server\/data\/|runtime\/|recordings\/|private\/|secrets\/)/i,
};
for (const row of objects) {
  const space = row.indexOf(" ");
  if (space < 0) continue;
  const sha = row.slice(0, space);
  const file = row.slice(space + 1);
  if (!file) continue;
  const types = Object.entries(rules).filter(([, re]) => re.test(file)).map(([name]) => name);
  if (types.length) suspects.set(`${sha}:${file}`, { sha, path: file, flags: types });
}

const reportPath = path.join(outputDir, "gitleaks-private.json");
let scanner = "unavailable";
let findingCount = null;
const versions = exec("gitleaks", ["version"]);
if (!versions.error && versions.status === 0) {
  // Gitleaks detect works across v8 versions. Raw matches remain outside Git.
  const scan = exec("gitleaks", [
    "detect", "--source", root, "--log-opts=--all", "--report-format=json",
    "--report-path", reportPath, "--no-banner",
  ]);
  if (fs.existsSync(reportPath)) {
    try {
      const rows = JSON.parse(fs.readFileSync(reportPath, "utf8"));
      findingCount = Array.isArray(rows) ? rows.length : null;
    } catch {
      scanner = "invalid-report";
    }
  }
  if (scanner !== "invalid-report") scanner = scan.status === 0 ? "ran-no-findings" : scan.status === 1 ? "ran-findings" : "scanner-error";
}
const grouped = Object.fromEntries(Object.keys(rules).map(name => [
  name, [...suspects.values()].filter(item => item.flags.includes(name)).length,
]));
const summary = {
  generatedAt: new Date().toISOString(),
  completeHistoryAvailable: !shallow,
  refCount: refs.length,
  pullRefCount: pullRefs.length,
  reachableObjectLines: objects.length,
  suspectHistoricalObjectPaths: suspects.size,
  categories: grouped,
  scanner,
  findingCount,
  nextActions: [
    "Fetch all refs, including pull request refs, in a COMPLETE authorized clone.",
    "Review flagged paths/provenance and privately review gitleaks output; rotate exposed keys.",
    "Record manual ownership/license decisions. Never publish the original repo just from a cleaned HEAD.",
  ],
};
fs.writeFileSync(path.join(outputDir, "summary.json"), JSON.stringify(summary, null, 2) + "\n");
fs.writeFileSync(path.join(outputDir, "suspect-paths-private.json"), JSON.stringify([...suspects.values()], null, 2) + "\n");
console.log(JSON.stringify(summary, null, 2));
if (shallow || refs.length === 0 || pullRefs.length === 0 || scanner !== "ran-no-findings" || suspects.size > 0) {
  console.error("HISTORY AUDIT NOT CLEARED: review local, private reports and sign off manually.");
  process.exitCode = 1;
}
