import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const checker=path.join(path.dirname(fileURLToPath(import.meta.url)),"math-video-v1-release-qa.mjs");
function run(...args){
  const result=spawnSync(process.execPath,[checker,...args],{encoding:"utf8"});
  assert.ok(result.stdout.trim(),result.stderr);
  return {status:result.status,report:JSON.parse(result.stdout)};
}

test("valid source map can pass structural preflight but never auto-approve release",()=>{
  const {status,report}=run("--manifest-only");
  assert.equal(status,0);
  assert.equal(report.ok,true);
  assert.equal(report.releaseReady,false);
  assert.equal(report.mode,"manifest-only");
  assert.ok(report.warnings.some(s=>s.includes("No rendered MP4")));
});
test("missing render is a hard failure",()=>{
  const {status,report}=run("--video","/file/that/does/not/exist.mp4");
  assert.equal(status,1);
  assert.ok(report.problems.some(s=>s.startsWith("video-present")));
});
test("release requires actual video, audio and explicit acceptance",()=>{
  const {status,report}=run("--release");
  assert.equal(status,1);
  assert.equal(report.releaseReady,false);
  for(const gate of ["release-requires-voice-track","acceptance-evidence-provided","release-video-present"]){
    assert.ok(report.problems.some(s=>s.startsWith(gate)));
  }
});
test("blank acceptance template cannot certify a video",()=>{
  const template=path.join(path.dirname(checker),"../docs/video-references/math-sincos-v1-acceptance-template.json");
  const {report}=run("--release","--require-audio","--acceptance",template);
  assert.equal(report.releaseReady,false);
  assert.ok(report.problems.some(s=>s.startsWith("source-visuals-reviewed")));
  assert.ok(report.problems.some(s=>s.startsWith("explicit-source-fidelity-accepted")));
});
