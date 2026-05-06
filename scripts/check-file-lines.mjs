import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const MAX_LINES = 400;
const ROOTS = ["src", "api", "scripts"];
const EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"]);
const ALLOWED_LARGE_FILES = new Set([
  "src/components/ui/sidebar.tsx",
  "src/lib/algorithms.ts",
  "src/lib/renderer.ts",
]);

function extname(path) {
  const index = path.lastIndexOf(".");
  return index >= 0 ? path.slice(index) : "";
}

function walk(dir) {
  let files = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) files = files.concat(walk(path));
    else files.push(path);
  }
  return files;
}

const tooLarge = ROOTS.flatMap((root) => {
  try {
    return walk(root);
  } catch {
    return [];
  }
})
  .filter((file) => EXTENSIONS.has(extname(file)))
  .map((file) => {
    const path = relative(process.cwd(), file).replaceAll("\\", "/");
    const lines = readFileSync(file, "utf8").split(/\r?\n/).length;
    return { path, lines };
  })
  .filter((file) => file.lines > MAX_LINES && !ALLOWED_LARGE_FILES.has(file.path));

if (tooLarge.length) {
  console.error(`Files must not exceed ${MAX_LINES} lines:`);
  for (const file of tooLarge) console.error(`- ${file.path}: ${file.lines}`);
  process.exit(1);
}
