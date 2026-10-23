#!/usr/bin/env node
// Deliberate release gate (NOT part of npm run validate:oss).
// A document-only release prep cannot automatically clear copyright, history or CI.
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "LICENSE", "THIRD_PARTY_NOTICES.md", "CONTRIBUTING.md",
  "SECURITY.md", "CODE_OF_CONDUCT.md", "SUPPORT.md", "CHANGELOG.md",
  "docs/oss/LICENSING.md", "docs/oss/ASSET_PROVENANCE.md",
  "docs/oss/RELEASE_CHECKLIST.md",
];
const missing = required.filter(name => !fs.existsSync(path.join(root, name)));
const unknownAssets = [
  "src/assets/sprites/01_mouse.png",
  "src/assets/audios/midis/SuperMarioMakerTitleTheme.mid",
  "haaland.jpg",
  "src/assets/marble-lets-go.wav",
].filter(name => fs.existsSync(path.join(root, name)));
const weightFiles = fs.existsSync(path.join(root, "models"))
  ? fs.readdirSync(path.join(root, "models")).filter(name => /\.onnx(?:\.json)?$/i.test(name))
  : [];
if (missing.length) console.error("Missing publication governance documents:", missing.join(", "));
if (unknownAssets.length) console.error("UNVERIFIED MEDIA (blocked until rights or replacement):", unknownAssets.join(", "));
if (weightFiles.length) console.error("Piper weights bundled without per-model clearance:", weightFiles.join(", "));
console.error("MANUAL BLOCKERS: complete commit-history secret/media audit, provenance decisions, owner approval, and passing real CI/test/build.");
console.error("See docs/oss/RELEASE_CHECKLIST.md.");
process.exitCode = 1; // Intentional until manual release checklist is signed off.
