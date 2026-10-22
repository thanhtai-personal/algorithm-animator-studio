import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
test("maintainer documentation and MIT attribution prepared", () => {
  for (const p of ["LICENSE","CONTRIBUTING.md","CODE_OF_CONDUCT.md","SECURITY.md","SUPPORT.md",
    "THIRD_PARTY_NOTICES.md","CHANGELOG.md","docs/oss/LICENSING.md","docs/oss/ASSET_PROVENANCE.md",
    "docs/oss/RELEASE_CHECKLIST.md","docs/oss/ARCHITECTURE.md","docs/oss/DEVELOPMENT.md",
    ".github/pull_request_template.md",".github/ISSUE_TEMPLATE/bug_report.md"]) {
    assert.ok(fs.existsSync(path.join(root,p)), `missing ${p}`);
  }
  assert.match(read("LICENSE"), /^MIT License/);
  assert.match(read("THIRD_PARTY_NOTICES.md"), /Remotion/);
  assert.match(read("THIRD_PARTY_NOTICES.md"), /FFmpeg/);
  assert.match(read("docs/oss/ASSET_PROVENANCE.md"), /UNKNOWN/);
  assert.match(read("docs/oss/RELEASE_CHECKLIST.md"), /BLOCKED/);
});
test("project package and lock metadata agree; accidental npm publish is disabled", () => {
  const pkg = JSON.parse(read("package.json"));
  const lock = JSON.parse(read("package-lock.json"));
  assert.equal(pkg.name,"algorithm-animator-studio");
  assert.equal(pkg.license,"MIT");
  assert.equal(lock.name,pkg.name);
  assert.equal(lock.packages[""].name,pkg.name);
  assert.equal(pkg.private,true);
  assert.equal(pkg.engines.node,">=22 <26");
});
test("README routes users to external TTS guides, legal and security policies", () => {
  const readme = read("README.md");
  for (const required of ["LICENSE](LICENSE)","THIRD_PARTY_NOTICES.md","CONTRIBUTING.md","SECURITY.md",
    "docs/oss/ASSET_PROVENANCE.md","docs/oss/RELEASE_CHECKLIST.md",
    "Piper","Supertonic","VieNeu","GPT-SoVITS","Applio","ElevenLabs"])
    assert.ok(readme.includes(required),`README missing ${required}`);
});
test("example env has no retired OAuth or YouTube download setup", () => {
  const sample=read(".env.example");
  assert.ok(sample.includes("VIENEU_AUTO_START=false"));
  assert.ok(sample.includes("WHISPER_PYTHON=python"));
  assert.doesNotMatch(sample,/YOUTUBE_CLIENT_SECRET|TIKTOK_CLIENT_SECRET|FACEBOOK_APP_SECRET|INSTAGRAM_APP_SECRET|YOUTUBE_DLP_EXE/);
});
