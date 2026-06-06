type RvcTemplateLike = {
  label: string;
  modelName: string;
  indexPath: string;
  ttsVoice?: string;
  argTemplate: unknown[];
};

type RvcTemplateRuntimeValues = {
  ttsVoice?: string;
};

export function assertApplioTemplateReady(template: RvcTemplateLike, values: RvcTemplateRuntimeValues = {}) {
  const missing: string[] = [];

  if (usesPlaceholder(template.argTemplate, ["${model}", "${model_name}"]) && !template.modelName.trim()) {
    missing.push("modelName");
  }
  if (usesPlaceholder(template.argTemplate, ["${index}", "${index_path}"]) && !template.indexPath.trim()) {
    missing.push("indexPath");
  }
  if (usesPlaceholder(template.argTemplate, ["${tts_voice}"]) && !(values.ttsVoice || template.ttsVoice || "").trim()) {
    missing.push("ttsVoice");
  }

  if (missing.length > 0) {
    throw new Error(`Applio template "${template.label}" thiếu ${missing.join(", ")}. Chọn voice model/index trong Applio rồi cập nhật Settings -> Voice -> Applio.`);
  }
}

function usesPlaceholder(value: unknown, tokens: string[]): boolean {
  if (typeof value === "string") return tokens.some((token) => value.includes(token));
  if (Array.isArray(value)) return value.some((item) => usesPlaceholder(item, tokens));
  if (value && typeof value === "object") return Object.values(value).some((item) => usesPlaceholder(item, tokens));
  return false;
}
