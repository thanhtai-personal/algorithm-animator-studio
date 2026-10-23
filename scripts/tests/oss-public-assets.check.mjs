import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
test("public source does not ship uncleared graphics or an old verification token", () => {
  for (const pathName of [
    "public/placeholder.svg", "public/kai-studio-logo.svg", "public/favicon.ico",
    "public/tiktokvtS33y2azjDpNOTmsOoslGOrlIURMck5.txt",
  ]) assert.equal(fs.existsSync(path.join(root, pathName)), false, `uncleared asset: ${pathName}`);
  assert.ok(fs.existsSync(path.join(root, "public/favicon.svg")));
  assert.match(read("index.html"), /href="\/favicon.svg"/);
  const codeRenderer = read("src/lib/renderers/codePanelRenderer.ts");
  assert.doesNotMatch(codeRenderer, /land-tile\.jpg/);
  for (const name of ["AppHeader", "AppSidebar"]) {
    const source = read(`src/components/${name}.tsx`);
    assert.doesNotMatch(source, /kai-studio-logo\.svg|placeholder\.svg/);
  }
});
