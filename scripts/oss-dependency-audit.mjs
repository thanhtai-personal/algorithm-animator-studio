#!/usr/bin/env node
/**
 * Read-only lockfile inventory, not a compliance sign-off.
 * This does not install packages or read secrets. Detailed output is local-only.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const lock = JSON.parse(fs.readFileSync(path.join(root, "package-lock.json"), "utf8"));
const dependencies = Object.entries(lock.packages || {})
  .filter(([name]) => Boolean(name))
  .map(([location, pkg]) => ({
    location, version: pkg.version ?? null, license: pkg.license ?? null,
    optional: Boolean(pkg.optional), dev: Boolean(pkg.dev),
  }));
const restricted = dependencies.filter(({ license }) =>
  !license || /Remotion License|SEE LICENSE|no charge|https?:\/\/|OpenRAIL/i.test(license)
);
const copyleft = dependencies.filter(({ license }) =>
  /^(AGPL|GPL|LGPL|MPL|EPL|CDDL)/i.test(license || "")
);
const byLicense = {};
for (const pkg of dependencies) {
  const key = pkg.license || "UNKNOWN";
  byLicense[key] = (byLicense[key] || 0) + 1;
}
const summary = {
  source: "package-lock.json",
  packageCount: dependencies.length,
  withoutLicenseMetadata: dependencies.filter(p => !p.license).length,
  licenses: byLicense,
  needsReview: restricted.length,
  copyleftPackageCount: copyleft.length,
  notable: ["@remotion/", "remotion", "@ffmpeg-installer/", "@ffprobe-installer/", "gsap"]
    .flatMap(pattern => dependencies.filter(d =>
      d.location === `node_modules/${pattern}` ||
      (pattern.endsWith("/") && d.location.startsWith(`node_modules/${pattern}`))
    ).map(d => ({ ...d, package: d.location.replace(/^node_modules\//, "") }))),
  warnings: [
    "Lockfile metadata is NOT a legal clearance or platform-specific binary SBOM.",
    "Check third-party license texts and redistribution obligations per actual build.",
    "Do not assume MIT repository licensing applies to Remotion, GSAP, FFmpeg or voice models.",
  ],
};
const dir = path.join(root, "artifacts", "oss-dependency-audit");
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, "summary.json"), JSON.stringify(summary, null, 2) + "\n");
fs.writeFileSync(path.join(dir, "review-candidates.json"), JSON.stringify({ restricted, copyleft }, null, 2) + "\n");
console.log(JSON.stringify({
  packageCount: summary.packageCount,
  withoutLicenseMetadata: summary.withoutLicenseMetadata,
  needsReview: summary.needsReview,
  copyleftPackageCount: summary.copyleftPackageCount,
  reportFolder: "artifacts/oss-dependency-audit",
}, null, 2));
// Nonzero is intentional until dependency/provenance decisions are signed off.
if (restricted.length || copyleft.length) process.exitCode = 1;
