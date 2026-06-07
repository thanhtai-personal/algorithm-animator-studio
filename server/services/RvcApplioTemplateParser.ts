import type { RvcApplioTemplateStatus } from "../models/RvcApplio";
import { DEFAULT_RVC_APPLIO_TEMPLATE_VALUES } from "../config/rvcApplioDefaults";
import type { RuntimeEnvValues } from "./EnvFileService";
import { readRvcApplioTemplateFile } from "./RvcApplioTemplateFileService";

export type RvcRuntimeTemplate = RvcApplioTemplateStatus & { argTemplate: unknown[] };

export function readRvcTemplates(env: RuntimeEnvValues): RvcRuntimeTemplate[] {
  const templateFile = readRvcApplioTemplateFile(env);
  return parseTemplateArray(templateFile.convertTemplates, env, "rvc-applio-templates.json convertTemplates");
}

export function readRvcTtsTemplates(env: RuntimeEnvValues): RvcRuntimeTemplate[] {
  const templateFile = readRvcApplioTemplateFile(env);
  return parseTemplateArray(templateFile.ttsTemplates, env, "rvc-applio-templates.json ttsTemplates");
}

function parseTemplateArray(value: unknown[], env: RuntimeEnvValues, label: string): RvcRuntimeTemplate[] {
  return value.map((item, index) => normalizeTemplateItem(item, index, env, label));
}

function normalizeTemplateItem(item: unknown, index: number, env: RuntimeEnvValues, envKey: string): RvcRuntimeTemplate {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw new Error(`${envKey} item #${index + 1} phải là object.`);
  }
  const record = item as Record<string, unknown>;
  const rawId = stringValue(record.id) || stringValue(record.name) || `template-${index + 1}`;
  const modelName = stringValue(record.modelName) || stringValue(record.model) || DEFAULT_RVC_APPLIO_TEMPLATE_VALUES.modelName;
  const label = stringValue(record.label) || stringValue(record.name) || modelName || `Applio template ${index + 1}`;
  return {
    id: sanitizeTemplateId(rawId, index),
    label,
    apiName: stringValue(record.apiName) || env.RVC_APPLIO_API_NAME || "/infer_convert",
    modelName,
    indexPath: stringValue(record.indexPath) || stringValue(record.index) || DEFAULT_RVC_APPLIO_TEMPLATE_VALUES.indexPath,
    argTemplate: readTemplateArgs(record),
    argTemplateConfigured: true,
    f0Method: normalizeF0Method(stringValue(record.f0Method) || DEFAULT_RVC_APPLIO_TEMPLATE_VALUES.f0Method),
    pitch: clampPitch(record.pitch ?? DEFAULT_RVC_APPLIO_TEMPLATE_VALUES.pitch),
    indexRate: clampRatio(record.indexRate ?? DEFAULT_RVC_APPLIO_TEMPLATE_VALUES.indexRate),
    protect: clampRatio(record.protect ?? DEFAULT_RVC_APPLIO_TEMPLATE_VALUES.protect),
    filterRadius: clampInteger(record.filterRadius ?? DEFAULT_RVC_APPLIO_TEMPLATE_VALUES.filterRadius, 0, 7),
    ttsVoice: stringValue(record.ttsVoice) || stringValue(record.voice) || "",
    ttsSpeed: clampInteger(record.ttsSpeed ?? record.speed ?? 0, -100, 100),
  };
}

function readTemplateArgs(record: Record<string, unknown>) {
  if (Array.isArray(record.argTemplate)) return record.argTemplate;
  if (typeof record.argTemplateJson === "string") return parseArgTemplate(record.argTemplateJson);
  throw new Error("Mỗi Applio template phải có argTemplate array.");
}

function parseArgTemplate(value?: string): unknown[] {
  if (!value?.trim()) throw new Error("Chưa cấu hình Applio arg template. Cập nhật server/data/config/rvc-applio-templates.json từ Gradio /config dependencies.");
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Friendly error below.
  }
  throw new Error("Applio arg template phải là một JSON array đúng định dạng Gradio API.");
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeTemplateId(value: string, index: number) {
  const sanitized = value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return sanitized || `template-${index + 1}`;
}

function normalizeF0Method(value: string) {
  return value.trim() || "rmvpe";
}

function clampPitch(value: unknown) {
  return clampInteger(value, -24, 24);
}

function clampRatio(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(1, Math.max(0, number));
}

function clampInteger(value: unknown, min = -100, max = 100) {
  const number = Math.round(Number(value));
  if (!Number.isFinite(number)) return 0;
  return Math.min(max, Math.max(min, number));
}
