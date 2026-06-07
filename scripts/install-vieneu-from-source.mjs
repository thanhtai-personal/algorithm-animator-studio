import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

const DEFAULT_SOURCE_DIR = "C:/DATA/working/sources/VieNeu-TTS";
const EXTRA_INDEX_URL = "https://pnnbao97.github.io/llama-cpp-python-v0.3.16/cpu/";

const sourceDir = path.resolve(process.env.VIENEU_SOURCE_DIR || DEFAULT_SOURCE_DIR);
const venvDir = path.join(sourceDir, ".venv");
const pythonExe = path.resolve(
  process.env.VIENEU_PYTHON ||
  (process.platform === "win32"
    ? path.join(venvDir, "Scripts", "python.exe")
    : path.join(venvDir, "bin", "python")),
);

function run(command, args, options = {}) {
  console.log(`> ${command} ${args.map((item) => (item.includes(" ") ? `"${item}"` : item)).join(" ")}`);
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32", ...options });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

if (!fs.existsSync(sourceDir)) {
  console.error(`Không tìm thấy VieNeu-TTS source: ${sourceDir}`);
  console.error("Hãy fork/clone repo VieNeu-TTS về đúng thư mục, ví dụ:");
  console.error("  cd /d C:\\DATA\\working\\sources");
  console.error("  git clone https://github.com/<your-github-user>/VieNeu-TTS.git VieNeu-TTS");
  process.exit(1);
}

if (!fs.existsSync(path.join(sourceDir, "pyproject.toml")) && !fs.existsSync(path.join(sourceDir, "setup.py"))) {
  console.error(`Thư mục này không giống Python package VieNeu-TTS: ${sourceDir}`);
  console.error("Cần có pyproject.toml hoặc setup.py để cài editable bằng pip install -e .");
  process.exit(1);
}

if (!fs.existsSync(pythonExe)) {
  run("python", ["-m", "venv", venvDir]);
}

run(pythonExe, ["-m", "pip", "install", "--upgrade", "pip", "setuptools", "wheel"]);
run(pythonExe, ["-m", "pip", "install", "-e", sourceDir, "--extra-index-url", EXTRA_INDEX_URL]);
run(pythonExe, ["-c", "import vieneu; print(getattr(vieneu, '__version__', 'dev'))"]);

console.log("\nVieNeu-TTS source install OK.");
console.log(`VIENEU_PYTHON=${pythonExe.replace(/\\/g, "/")}`);
console.log("Copy giá trị VIENEU_PYTHON này vào .env hoặc Settings -> Voice -> VieNeu.");
