import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = name => fs.readFileSync(path.join(root, name), "utf8");

test("unverified media are not TRACKED in the distributable source", () => {
  // A developer can add ignored, licensed local packs. Do not reject local files.
  const patterns = [
    "src/assets/sprites", "src/assets/audios/select-audio",
    "src/assets/audios/swap-audio", "src/assets/audios/midis",
    "src/assets/marble-lets-go.wav", "src/assets/marble-count-one.wav",
    "src/assets/marble-count-two.wav", "src/assets/marble-count-three.wav",
    "haaland.jpg",
  ];
  const result = spawnSync("git", ["ls-files", "--cached", "--", ...patterns], {
    cwd: root, encoding: "utf8", windowsHide: true,
  });
  if (result.status !== 0) {
    // Source ZIP without .git: static procedural fallback checks still apply below.
    assert.equal(fs.existsSync(path.join(root, ".git")), false, "Git tracked-media audit failed in a Git checkout");
    return;
  }
  assert.equal(result.stdout.trim(), "", "unverified media remain tracked in the Git index");
});

test("animal visual mode remains available as procedural drawing", () => {
  const animals = read("src/lib/animalColumns.ts");
  const renderer = read("src/lib/renderers/animalColumnRenderer.ts");
  assert.match(animals, /Array\.from\(\{ length: 20 \}/);
  assert.match(renderer, /ANIMAL_SYMBOLS/);
  assert.match(renderer, /drawFallbackAnimal/);
  assert.match(renderer, /drawSceneBackdrop/);
  assert.doesNotMatch(renderer, /land-tile\.jpg|LandTileMapSprite/);
});

test("SFX and procedural background music remain available without audio packs", () => {
  const engine = read("src/lib/audio.ts");
  assert.match(engine, /setMusicPreset/);
  assert.match(engine, /playSfx/);
  const sounds = read("src/lib/selectSounds.ts");
  assert.match(sounds, /SELECT_ASSET_SFX_OPTIONS/); // empty when no optional pack exists
  assert.match(sounds, /SWAP_ASSET_SFX_OPTIONS/);
});
