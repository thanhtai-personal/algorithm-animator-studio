import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");

test("AI context index does not route into retired source", () => {
  const index = JSON.parse(read("docs/ai-context/index.json"));
  const ids = new Set(index.domains.map((domain) => domain.id));
  for (const id of ["rhythmic-studio", "marble-tower", "news-channels", "story-production"]) {
    assert.ok(!ids.has(id), `retired AI index domain still present: ${id}`);
  }
  for (const domain of index.domains) {
    for (const related of domain.related || []) {
      assert.ok(ids.has(related), `unknown related domain: ${domain.id} -> ${related}`);
    }
    for (const item of domain.primary || []) {
      assert.ok(fs.existsSync(path.join(root, item.path)), `missing primary: ${domain.id}/${item.path}`);
    }
  }
});

test("generated semantic/source graph is not shipped as fresh OSS metadata", () => {
  for (const filename of [
    ".understand-anything/meta.json",
    ".understand-anything/knowledge-graph.json",
    ".understand-anything/fingerprints.json",
    ".understand-anything/intermediate/scan-result.json",
  ]) {
    assert.equal(fs.existsSync(path.join(root, filename)), false, `stale generated graph tracked: ${filename}`);
  }
  assert.match(read(".gitignore"), /\.understand-anything\//);
});
