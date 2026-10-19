#!/usr/bin/env node
/**
 * Task 07: render one actual Remotion still per reference beat.
 * Produces evidence for human visual review; it DOES NOT certify fidelity.
 * Uses one Remotion bundle instead of 36 separate CLI invocations.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const require=createRequire(import.meta.url);
const manifest=JSON.parse(fs.readFileSync(path.join(root,
  "docs/video-references/math-sincos-v1.scene-manifest.json"),"utf8"));
const output=path.resolve(process.argv[2]||"generated-videos/math-v1-qa-stills");
fs.mkdirSync(output,{recursive:true});
const entry=path.join(root,"src/features/remotion-video/remotion/index.ts");
const serveUrl=await bundle({entryPoint:entry,webpackOverride:(config)=>config});
const composition=await selectComposition({serveUrl,id:"MathSinCosV1"});
if(composition.fps!==25||composition.durationInFrames!==15217
   ||composition.width!==1280||composition.height!==720)
  throw new Error("Remotion metadata does not match the 25fps reference.");
const files=[];
for(const [index,beat] of manifest.referenceBeats.entries()){
  const frame=Math.floor((beat.startFrame+beat.endFrame-1)/2);
  const filename=`${String(index+1).padStart(2,"0")}-${beat.id}-f${String(frame).padStart(5,"0")}.png`;
  const location=path.join(output,filename);
  await renderStill({serveUrl,composition,frame,output:location,logLevel:"error"});
  if(!fs.statSync(location).size)throw new Error("Blank still "+filename);
  files.push({beatId:beat.id,chapterId:beat.chapterId,frame,
    timestampSeconds:frame/25,filename,referenceVerified:false});
  console.log(`${index+1}/${manifest.referenceBeats.length}: ${filename}`);
}
fs.writeFileSync(path.join(output,"still-index.json"),JSON.stringify({
  kind:"visual-review-candidates",framePerfect:false,reviewed:false,
  sourceVideoBundled:false,files,
},null,2)+"\n");
console.log("Wrote "+files.length+" real Remotion stills. Human source comparison remains required.");
