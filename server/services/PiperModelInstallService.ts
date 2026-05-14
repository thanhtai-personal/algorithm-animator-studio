import fs from "node:fs";
import fsp from "node:fs/promises";
import https from "node:https";
import { MODEL_DIR, PIPER_EXE } from "../config/paths";
import { MODELS } from "../config/piperModels";
import { modelJsonPath, toModelResponse } from "../utils/modelFiles";

export async function getPiperRuntimeStatus() {
  const models = Object.values(MODELS).map(toModelResponse);
  const availableCount = models.filter((model) => model.available).length;

  return {
    ok: fs.existsSync(PIPER_EXE) && availableCount > 0,
    piperExe: PIPER_EXE,
    piperExists: fs.existsSync(PIPER_EXE),
    modelDir: MODEL_DIR,
    availableCount,
    models,
    installHint: [
      "Piper exe mặc định nằm ở models/.venv/Scripts/piper.exe trên Windows hoặc models/.venv/bin/piper trên macOS/Linux.",
      "Model cần đủ 2 file: *.onnx và *.onnx.json trong thư mục models.",
      "Có thể bấm Cài model nếu máy có internet. Piper executable vẫn cần được cài bằng pip/install script riêng.",
    ],
  };
}

export async function installPiperModel(modelKey: string) {
  const model = MODELS[modelKey];
  if (!model) throw new Error("Model Piper không hợp lệ.");
  if (!model.modelUrl || !model.jsonUrl) throw new Error("Model này chưa có link tải tự động.");

  await fsp.mkdir(MODEL_DIR, { recursive: true });
  await downloadIfMissing(model.modelUrl, model.modelPath);
  await downloadIfMissing(model.jsonUrl, modelJsonPath(model.modelPath));

  return { ok: true, model: toModelResponse(model), status: await getPiperRuntimeStatus() };
}

function downloadIfMissing(url: string, outputPath: string): Promise<void> {
  if (fs.existsSync(outputPath)) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const tempPath = `${outputPath}.download`;
    const file = fs.createWriteStream(tempPath);
    const cleanup = () => fs.rmSync(tempPath, { force: true });

    const request = https.get(url, (response) => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        cleanup();
        downloadIfMissing(response.headers.location, outputPath).then(resolve, reject);
        return;
      }

      if (response.statusCode !== 200) {
        file.close();
        cleanup();
        reject(new Error(`Tải model thất bại (${response.statusCode}): ${url}`));
        return;
      }

      response.pipe(file);
      file.on("finish", () => {
        file.close();
        fs.renameSync(tempPath, outputPath);
        resolve();
      });
    });

    request.setTimeout(15 * 60 * 1000, () => request.destroy(new Error("Tải model quá lâu, kết nối đã timeout.")));
    request.on("error", (error) => {
      file.close();
      cleanup();
      reject(error);
    });
  });
}
