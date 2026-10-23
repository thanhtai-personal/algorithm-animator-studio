import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

test("source snapshot strips history and is never mistaken for published release", () => {
  const source = read("scripts/oss-source-snapshot.mjs");
  assert.match(source, /git\("archive"/);
  assert.match(source, /"HEAD"\)/);
  assert.match(source, /REVIEW ONLY - NOT A RELEASE/);
  assert.doesNotMatch(source, /gh release create|git push|update-ref|force-push/);
});

test("release candidate workflow refuses unapproved distribution", () => {
  const wf = read(".github/workflows/oss-source-candidate.yml");
  assert.match(wf, /workflow_dispatch:/);
  for (const gate of ["npm ci", "npm run validate:oss", "npm run audit:oss:deps", "npm run audit:oss:release"]) {
    assert.ok(wf.includes(gate), `missing release gate: ${gate}`);
  }
  assert.doesNotMatch(wf, /gh release create|git push --tags/);
});
