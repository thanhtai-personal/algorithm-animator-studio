import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const FEATURE_ROOT = path.resolve("src/features");
const SCREEN_NAME_PATTERN = /(Page|Screen|Layout|Shell|Modal|Drawer)\.tsx$/;
const WRAPPER_EXPORT_PATTERN =
  /^export\s+(?:\*\s+from|\{[\s\S]*?\}\s+from)\s+["']\.\.\/views\/([^"']+)["'];?\s*$/;

async function listFeatureComponentFiles(rootDir) {
  const featureNames = await readdir(rootDir);
  const files = [];

  for (const featureName of featureNames) {
    const featureDir = path.join(rootDir, featureName);
    const featureStat = await stat(featureDir).catch(() => null);
    if (!featureStat?.isDirectory()) continue;

    const componentsDir = path.join(featureDir, "components");
    const componentsStat = await stat(componentsDir).catch(() => null);
    if (!componentsStat?.isDirectory()) continue;

    const entries = await readdir(componentsDir);
    for (const entry of entries) {
      if (!SCREEN_NAME_PATTERN.test(entry)) continue;
      const fullPath = path.join(componentsDir, entry);
      const entryStat = await stat(fullPath).catch(() => null);
      if (!entryStat?.isFile()) continue;
      files.push(fullPath);
    }
  }

  return files.sort();
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

async function main() {
  const files = await listFeatureComponentFiles(FEATURE_ROOT);
  const violations = [];

  for (const filePath of files) {
    const source = await readFile(filePath, "utf8");
    const trimmed = source.trim();
    const relativePath = toPosixPath(path.relative(process.cwd(), filePath));
    const fileName = path.basename(filePath, ".tsx");
    const expectedViewDir = path.resolve(path.dirname(filePath), "..", "views", fileName);
    const expectedViewFile = path.join(expectedViewDir, `${fileName}.tsx`);
    const wrapperMatch = trimmed.match(WRAPPER_EXPORT_PATTERN);

    if (!wrapperMatch) {
      violations.push(
        `${relativePath}: screen-level component must be a thin re-export wrapper to ../views/${fileName}/${fileName}`
      );
      continue;
    }

    const target = wrapperMatch[1];
    const normalizedTarget = target.replace(/\\/g, "/");
    const expectedTarget = `${fileName}/${fileName}`;
    if (normalizedTarget !== expectedTarget) {
      violations.push(
        `${relativePath}: wrapper must re-export ../views/${expectedTarget} (found ../views/${normalizedTarget})`
      );
      continue;
    }

    const viewStat = await stat(expectedViewFile).catch(() => null);
    if (!viewStat?.isFile()) {
      violations.push(
        `${relativePath}: missing implementation file ${toPosixPath(path.relative(process.cwd(), expectedViewFile))}`
      );
    }
  }

  if (violations.length > 0) {
    console.error("Feature view-boundary violations detected:\n");
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("Feature view-boundary check passed.");
}

await main();
