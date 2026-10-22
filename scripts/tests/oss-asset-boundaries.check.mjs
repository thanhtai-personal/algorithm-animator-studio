import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = name => fs.readFileSync(path.join(root, name), "utf8");

test("unverified bundled sprites, MIDI, SFX, photos and old audio are absent", () => {
  for (const target of [
    "src/assets/sprites", "src/assets/audios", "src/assets/marble-lets-go.wav",
    "src/assets/marble-count-one.wav", "src/assets/marble-count-two.wav",
    "src/assets/marble-count-three.wav", "haaland.jpg",
  ]) assert.equal(fs.existsSync(path.join(root, target)), false, `asset still bundled: ${target}`);
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
