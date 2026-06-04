const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = process.cwd();
const outDir = path.join(root, ".understand-anything");
const intermediateDir = path.join(outDir, "intermediate");
fs.mkdirSync(intermediateDir, { recursive: true });

const textExtensions = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".cjs", ".mjs", ".json", ".md", ".html",
  ".css", ".scss", ".yml", ".yaml", ".toml", ".config", ".txt"
]);
const excludedExtensions = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".woff", ".woff2",
  ".ttf", ".eot", ".mp3", ".mp4", ".wav", ".onnx", ".pdf", ".zip",
  ".tar", ".gz", ".map"
]);
const excludedNames = new Set([
  "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb", "LICENSE"
]);
const excludedDirs = new Set([
  ".git", "node_modules", "dist", "build", "out", "coverage", "release",
  "dist-electron", ".cache", ".turbo"
]);

function normalizePath(filePath) {
  return filePath.split(path.sep).join("/");
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (excludedDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }
    const relPath = normalizePath(path.relative(root, fullPath));
    if (relPath.startsWith(".understand-anything/")) continue;
    if (excludedNames.has(entry.name)) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (excludedExtensions.has(ext)) continue;
    if (!textExtensions.has(ext) && !entry.name.includes(".")) continue;
    files.push(relPath);
  }
  return files;
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function languageOf(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const name = path.basename(filePath);
  if ([".ts", ".tsx"].includes(ext)) return "typescript";
  if ([".js", ".jsx", ".cjs", ".mjs"].includes(ext)) return "javascript";
  if (ext === ".json") return "json";
  if (ext === ".md") return "markdown";
  if (ext === ".html") return "html";
  if ([".css", ".scss"].includes(ext)) return "css";
  if ([".yml", ".yaml"].includes(ext)) return "yaml";
  if (name.includes("config")) return "config";
  return "text";
}

function categoryOf(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const name = path.basename(filePath);
  if (filePath.startsWith("docs/") || ext === ".md") return "docs";
  if (filePath.startsWith("api/") || filePath.startsWith("server/") || filePath.startsWith("electron/")) return "code";
  if (filePath.startsWith("src/") && [".ts", ".tsx", ".js", ".jsx"].includes(ext)) return "code";
  if ([".json", ".yml", ".yaml", ".toml"].includes(ext) || name.includes("config")) return "config";
  if ([".html", ".css", ".scss"].includes(ext)) return "markup";
  return "data";
}

function nodeTypeForCategory(category) {
  if (category === "docs") return "document";
  if (category === "config") return "config";
  return "file";
}

function nodeIdForFile(filePath, category) {
  return `${nodeTypeForCategory(category)}:${filePath}`;
}

function summaryForFile(filePath, category) {
  if (filePath === "src/App.tsx") return "Defines the main React router, application shell and page-level navigation.";
  if (filePath === "src/main.tsx") return "Bootstraps the React application and mounts the router into the browser DOM.";
  if (filePath === "server/index.ts") return "Starts the Express API server and wires route modules for generation, media, publishing and runtime services.";
  if (filePath.startsWith("server/routes/")) return "Defines Express routes for a server-side API capability.";
  if (filePath.startsWith("server/services/")) return "Implements backend service logic for media generation, validation, runtime settings or publishing.";
  if (filePath.startsWith("server/models/")) return "Defines TypeScript data contracts used by backend services and routes.";
  if (filePath.startsWith("src/pages/")) return "Implements a React page for a major studio workflow or application route.";
  if (filePath.startsWith("src/features/")) return "Implements a feature-area hook, component, API helper or type model.";
  if (filePath.startsWith("src/lib/algorithms/")) return "Implements algorithm simulation data, frames, complexity metadata or algorithm-specific logic.";
  if (filePath.startsWith("src/lib/renderers/")) return "Renders algorithm and animation frames onto canvas-oriented visuals.";
  if (filePath.startsWith("src/components/ui/")) return "Provides reusable shadcn/Radix UI primitives used across the frontend.";
  if (category === "document") return "Documents project behavior, tasks or implementation notes.";
  if (category === "config") return "Configures project tooling, build behavior or deployment metadata.";
  return "Project source file participating in the application architecture.";
}

function tagsForFile(filePath, category) {
  const tags = [category];
  for (const part of filePath.split("/").slice(0, 3)) {
    if (!part.includes(".")) tags.push(part);
  }
  if (filePath.includes("algorithm")) tags.push("algorithms");
  if (filePath.includes("video")) tags.push("video");
  if (filePath.includes("youtube")) tags.push("youtube");
  if (filePath.includes("mu-news")) tags.push("news");
  return [...new Set(tags)].slice(0, 8);
}

function resolveImport(sourcePath, specifier, fileSet) {
  if (!specifier.startsWith(".") && !specifier.startsWith("@/")) return null;
  const sourceDir = path.dirname(sourcePath);
  const base = specifier.startsWith("@/")
    ? specifier.slice(2)
    : normalizePath(path.normalize(path.join(sourceDir, specifier)));
  const candidates = [
    base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`,
    `${base}.cjs`, `${base}.mjs`, `${base}/index.ts`, `${base}/index.tsx`,
    `${base}/index.js`, `${base}/index.jsx`
  ];
  return candidates.find(candidate => fileSet.has(candidate)) || null;
}

function extractImports(filePath, content, fileSet) {
  const imports = new Set();
  const patterns = [
    /import\s+(?:[^'"]+?\s+from\s+)?["']([^"']+)["']/g,
    /export\s+[^'"]*?\s+from\s+["']([^"']+)["']/g,
    /import\(["']([^"']+)["']\)/g,
    /require\(["']([^"']+)["']\)/g
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content))) {
      const resolved = resolveImport(filePath, match[1], fileSet);
      if (resolved) imports.add(resolved);
    }
  }
  return [...imports];
}

function extractSymbols(filePath, content) {
  const nodes = [];
  const symbolPatterns = [
    { type: "function", regex: /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)/g },
    { type: "class", regex: /(?:export\s+)?(?:class|interface|type)\s+([A-Za-z0-9_]+)/g },
    { type: "function", regex: /(?:export\s+)?const\s+(use[A-Z][A-Za-z0-9_]*)\s*=/g },
    { type: "function", regex: /(?:export\s+)?const\s+([A-Z][A-Za-z0-9_]*)\s*[:=]/g }
  ];
  for (const { type, regex } of symbolPatterns) {
    let match;
    while ((match = regex.exec(content))) {
      const name = match[1];
      nodes.push({
        id: `${type}:${filePath}:${name}`,
        type,
        name,
        filePath,
        summary: `${name} is declared in ${filePath}.`,
        complexity: "moderate",
        tags: [type, "symbol"]
      });
    }
  }
  const seen = new Set();
  return nodes.filter(node => {
    if (seen.has(node.id)) return false;
    seen.add(node.id);
    return true;
  }).slice(0, 8);
}

function edge(source, target, type, weight = 0.5, description) {
  return { source, target, type, weight, description: description || `${source} ${type} ${target}` };
}

const packageJson = readJson(path.join(root, "package.json"), {});
const allFiles = walk(root).sort();
const fileSet = new Set(allFiles);
const nodes = [];
const edges = [];
const importMap = {};
const scanFiles = [];
const sourceFilePaths = [];
let filteredByIgnore = 0;

for (const filePath of allFiles) {
  const absPath = path.join(root, filePath);
  let content = "";
  try {
    content = fs.readFileSync(absPath, "utf8");
  } catch {
    filteredByIgnore++;
    continue;
  }
  const language = languageOf(filePath);
  const fileCategory = categoryOf(filePath);
  const sizeLines = content ? content.split(/\r?\n/).length : 0;
  const fileNodeId = nodeIdForFile(filePath, fileCategory);
  sourceFilePaths.push(filePath);
  scanFiles.push({ path: filePath, language, sizeLines, fileCategory });
  nodes.push({
    id: fileNodeId,
    type: nodeTypeForCategory(fileCategory),
    name: path.basename(filePath),
    filePath,
    summary: summaryForFile(filePath, fileCategory),
    complexity: sizeLines > 300 ? "complex" : sizeLines > 120 ? "moderate" : "simple",
    tags: tagsForFile(filePath, fileCategory)
  });
  const imports = fileCategory === "code" ? extractImports(filePath, content, fileSet) : [];
  importMap[filePath] = imports;
  for (const target of imports) {
    const targetCategory = categoryOf(target);
    edges.push(edge(fileNodeId, nodeIdForFile(target, targetCategory), "imports", 0.7));
  }
  if (fileCategory === "code") {
    for (const symbol of extractSymbols(filePath, content)) {
      nodes.push(symbol);
      edges.push(edge(fileNodeId, symbol.id, "contains", 1.0));
    }
  }
}

for (const node of nodes.filter(n => n.type === "document")) {
  if (node.filePath.startsWith("docs/tasks/")) edges.push(edge("document:README.md", node.id, "documents", 0.5));
}

const configNodeIds = nodes.filter(n => n.type === "config").map(n => n.id);
for (const id of configNodeIds) {
  if (nodes.some(n => n.id === "file:src/main.tsx")) edges.push(edge(id, "file:src/main.tsx", "configures", 0.6));
  if (nodes.some(n => n.id === "file:server/index.ts")) edges.push(edge(id, "file:server/index.ts", "configures", 0.6));
}

const routeFiles = nodes.filter(n => n.filePath && n.filePath.startsWith("server/routes/"));
const serviceFiles = nodes.filter(n => n.filePath && n.filePath.startsWith("server/services/"));
for (const routeNode of routeFiles) {
  const stem = path.basename(routeNode.filePath).replace(/Routes\.ts$/, "").toLowerCase();
  const serviceNode = serviceFiles.find(n => n.name.toLowerCase().includes(stem));
  if (serviceNode) edges.push(edge(routeNode.id, serviceNode.id, "calls", 0.8));
  if (nodes.some(n => n.id === "file:server/index.ts")) edges.push(edge("file:server/index.ts", routeNode.id, "routes", 0.5));
}

const layers = [
  ["layer:frontend-shell", "Frontend Shell", "React entry points, routing, global styling and shared navigation.", n => n.filePath === "src/main.tsx" || n.filePath === "src/App.tsx" || n.filePath === "src/index.css" || n.filePath === "src/App.css" || n.filePath?.startsWith("src/components/")],
  ["layer:studio-pages", "Studio Pages", "Page-level React workflows for algorithm videos, long content, story tools, settings and publishing.", n => n.filePath?.startsWith("src/pages/")],
  ["layer:feature-modules", "Feature Modules", "Feature-specific hooks, API clients, components and domain types.", n => n.filePath?.startsWith("src/features/")],
  ["layer:algorithm-engine", "Algorithm Engine", "Algorithm simulations, timelines, renderers, sprites, media registries and canvas utilities.", n => n.filePath?.startsWith("src/lib/") || n.filePath?.startsWith("src/assets/")],
  ["layer:backend-api", "Backend API", "Express server routes, services, models, runtime config and backend utilities.", n => n.filePath?.startsWith("server/") || n.filePath?.startsWith("api/")],
  ["layer:desktop-runtime", "Desktop Runtime", "Electron bootstrap and desktop runtime integration files.", n => n.filePath?.startsWith("electron/")],
  ["layer:project-tooling", "Project Tooling", "Build, TypeScript, lint, Tailwind, deployment and package metadata.", n => n.type === "config" || ["package.json", "index.html"].includes(n.filePath)],
  ["layer:documentation", "Documentation", "README and task documentation describing product behavior and implementation history.", n => n.type === "document"]
].map(([id, name, description, predicate]) => ({
  id,
  name,
  description,
  nodeIds: nodes
    .filter(n => ["file", "config", "document", "service", "pipeline", "table", "schema", "resource", "endpoint"].includes(n.type))
    .filter(predicate)
    .map(n => n.id)
}));

const assigned = new Set(layers.flatMap(layer => layer.nodeIds));
const unassigned = nodes
  .filter(n => ["file", "config", "document"].includes(n.type) && !assigned.has(n.id))
  .map(n => n.id);
if (unassigned.length) {
  layers.push({
    id: "layer:miscellaneous",
    name: "Miscellaneous",
    description: "Remaining project files that do not fit a dominant architectural area.",
    nodeIds: unassigned
  });
}

const tour = [
  {
    order: 1,
    title: "Project Overview",
    description: "Start with the README and package manifest to understand the AlgoShorts Studio purpose, scripts and dependencies.",
    nodeIds: ["document:README.md", "config:package.json"].filter(id => nodes.some(n => n.id === id))
  },
  {
    order: 2,
    title: "Application Boot",
    description: "Follow the React boot sequence from the browser entry point into the application router.",
    nodeIds: ["file:src/main.tsx", "file:src/App.tsx"].filter(id => nodes.some(n => n.id === id))
  },
  {
    order: 3,
    title: "Studio Workflows",
    description: "Inspect page modules that coordinate algorithm videos, long-form content, story review and publishing flows.",
    nodeIds: ["file:src/pages/Index.tsx", "file:src/pages/LongContent.tsx", "file:src/pages/StoryVideoStudio.tsx", "file:src/pages/YoutubePublishing.tsx"].filter(id => nodes.some(n => n.id === id))
  },
  {
    order: 4,
    title: "Algorithm And Rendering Core",
    description: "Explore algorithm implementations, timeline builders and canvas renderers that generate animated visuals.",
    nodeIds: ["file:src/lib/algorithms/index.ts", "file:src/lib/renderer.ts", "file:src/lib/longContentRenderer.ts", "file:src/lib/renderers/index.ts"].filter(id => nodes.some(n => n.id === id))
  },
  {
    order: 5,
    title: "Backend API Services",
    description: "Trace how the Express server exposes media, voice, generation and publishing capabilities through routes and services.",
    nodeIds: ["file:server/index.ts", "file:server/services/VideoService.ts", "file:server/services/TtsGenerationService.ts", "file:server/services/YoutubeUploadService.ts"].filter(id => nodes.some(n => n.id === id))
  },
  {
    order: 6,
    title: "Desktop And Deployment",
    description: "Review Electron runtime files and deployment metadata for desktop and public web builds.",
    nodeIds: ["file:electron/main.cjs", "file:electron/runtime-bootstrap.cjs", "config:vercel.json"].filter(id => nodes.some(n => n.id === id))
  }
];

const languages = [...new Set(scanFiles.map(f => f.language))].sort();
const frameworks = ["React", "Vite", "TypeScript", "Express", "Electron", "Tailwind CSS", "shadcn/Radix UI"];
const gitCommitHash = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
const project = {
  name: packageJson.build?.productName || packageJson.name || "algorithm-animator-studio-pro",
  languages,
  frameworks,
  description: packageJson.description || "Algorithm animation, voice-over and publishing studio.",
  analyzedAt: new Date().toISOString(),
  gitCommitHash
};

const graph = { version: "1.0.0", project, nodes, edges, layers, tour };
const scanResult = {
  projectName: project.name,
  projectDescription: project.description,
  languages,
  frameworks,
  files: scanFiles,
  importMap,
  complexity: scanFiles.length > 200 ? "complex" : "moderate",
  filteredByIgnore
};

const issues = [];
const warnings = [];
const nodeIds = new Set(nodes.map(n => n.id));
for (const graphEdge of edges) {
  if (!nodeIds.has(graphEdge.source) || !nodeIds.has(graphEdge.target)) issues.push(`Dangling edge ${graphEdge.source} -> ${graphEdge.target}`);
}
for (const layer of layers) {
  for (const id of layer.nodeIds) if (!nodeIds.has(id)) issues.push(`Layer ${layer.id} references missing ${id}`);
}
for (const step of tour) {
  for (const id of step.nodeIds) if (!nodeIds.has(id)) issues.push(`Tour step ${step.order} references missing ${id}`);
}
const connected = new Set(edges.flatMap(e => [e.source, e.target]));
for (const node of nodes) {
  if (!connected.has(node.id)) warnings.push(`Node '${node.id}' has no edges (orphan)`);
}
const stats = {
  totalNodes: nodes.length,
  totalEdges: edges.length,
  totalLayers: layers.length,
  tourSteps: tour.length,
  nodeTypes: nodes.reduce((acc, node) => ((acc[node.type] = (acc[node.type] || 0) + 1), acc), {}),
  edgeTypes: edges.reduce((acc, graphEdge) => ((acc[graphEdge.type] = (acc[graphEdge.type] || 0) + 1), acc), {})
};

fs.writeFileSync(path.join(intermediateDir, "scan-result.json"), JSON.stringify(scanResult, null, 2));
fs.writeFileSync(path.join(intermediateDir, "assembled-graph.json"), JSON.stringify(graph, null, 2));
fs.writeFileSync(path.join(intermediateDir, "layers.json"), JSON.stringify(layers, null, 2));
fs.writeFileSync(path.join(intermediateDir, "tour.json"), JSON.stringify(tour, null, 2));
fs.writeFileSync(path.join(intermediateDir, "review.json"), JSON.stringify({ issues, warnings, stats }, null, 2));
fs.writeFileSync(path.join(intermediateDir, "fingerprint-input.json"), JSON.stringify({ projectRoot: root, sourceFilePaths, gitCommitHash }, null, 2));
console.log(JSON.stringify({ files: scanFiles.length, nodes: nodes.length, edges: edges.length, layers: layers.length, tourSteps: tour.length, issues: issues.length, warnings: warnings.length }, null, 2));
