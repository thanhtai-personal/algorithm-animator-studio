import { spawnSync } from "node:child_process";

// Verify what Git will publish, not what an individual developer has locally.
// A gitignored, locally installed VieNeu SDK may exist without being in the OSS tree.
export function trackedFilesUnder(repoRoot, relativeDir) {
  const dir = String(relativeDir).replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/+$/, "");
  if (!dir || dir === "." || dir.startsWith("../") || dir.includes("/../")) {
    throw new Error(`Unsafe tracked-file path: ${relativeDir}`);
  }
  const result = spawnSync("git", ["-C", repoRoot, "ls-files", "--cached", "--", `${dir}/`], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`Unable to check Git-tracked files under ${dir}; use a Git checkout: ${result.error?.message || result.stderr?.trim() || "git ls-files failed"}`);
  }
  return result.stdout.split(/\r?\n/).filter(Boolean);
}
