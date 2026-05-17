import { EMPTY_YOUTUBE_UPLOAD } from "../constants/youtubeDefaults";

export type YoutubeUploadForm = typeof EMPTY_YOUTUBE_UPLOAD;

export function buildYoutubeUploadFormData(params: {
  uploadForm: YoutubeUploadForm;
  videoFile: File;
  refreshToken: string;
}): FormData {
  const formData = new FormData();

  formData.append("video", params.videoFile);
  appendField(formData, "title", params.uploadForm.title);
  appendField(formData, "description", params.uploadForm.description);
  appendField(formData, "tags", params.uploadForm.tags);
  appendField(formData, "categoryId", params.uploadForm.categoryId);
  appendField(formData, "privacyStatus", params.uploadForm.privacyStatus);
  appendField(formData, "playlistId", params.uploadForm.playlistId);
  appendField(formData, "publishAt", toUtcIsoString(params.uploadForm.publishAt));
  appendField(formData, "madeForKids", String(params.uploadForm.madeForKids));
  appendField(formData, "notifySubscribers", String(params.uploadForm.notifySubscribers));
  appendField(
    formData,
    "containsSyntheticMedia",
    String(params.uploadForm.containsSyntheticMedia)
  );
  appendField(formData, "refreshToken", params.refreshToken);

  return formData;
}

function appendField(formData: FormData, name: string, value: string) {
  if (value) {
    formData.append(name, value);
  }
}

function toUtcIsoString(value: string): string {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString();
}
