export type ExportFormat = "webm" | "mp4";

export const EXPORT_FORMATS: { id: ExportFormat; label: string; mimeCandidates: string[] }[] = [
  {
    id: "webm",
    label: "WebM",
    mimeCandidates: ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"],
  },
  {
    id: "mp4",
    label: "MP4",
    mimeCandidates: [
      "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
      "video/mp4;codecs=h264,aac",
      "video/mp4",
    ],
  },
];

export function getExportFormat(format: ExportFormat) {
  return EXPORT_FORMATS.find((item) => item.id === format) ?? EXPORT_FORMATS[0];
}
