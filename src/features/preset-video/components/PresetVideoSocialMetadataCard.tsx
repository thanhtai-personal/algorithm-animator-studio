import { Clipboard, Hash, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PresetVideoLanguage, PresetVideoSocialCopy, PresetVideoSocialMetadata } from "../types";

const UI_COPY = {
  vi: {
    heading: "Social SEO",
    longForm: "YouTube / Facebook video",
    shortForm: "Short / Reel",
    copy: "Sao chép",
    keywords: "Từ khóa",
    pinnedComment: "Bình luận ghim",
    musicCredit: "Nguồn nhạc",
    copied: "Đã sao chép bộ Social SEO.",
    copyFailed: "Không sao chép được. Hãy chọn nội dung và sao chép thủ công.",
  },
  en: {
    heading: "Social SEO",
    longForm: "YouTube / Facebook video",
    shortForm: "Short / Reel",
    copy: "Copy",
    keywords: "Keywords",
    pinnedComment: "Pinned comment",
    musicCredit: "Music credit",
    copied: "Social SEO copy copied.",
    copyFailed: "Could not copy. Select the content and copy it manually.",
  },
} as const;

export function PresetVideoSocialMetadataCard(props: {
  metadata: PresetVideoSocialMetadata;
  language: PresetVideoLanguage;
  musicCredit?: string;
}) {
  const labels = UI_COPY[props.language];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Search className="h-4 w-4" />
          {labels.heading}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SocialCopyBlock label={labels.longForm} copy={props.metadata.longForm} musicCredit={props.musicCredit} labels={labels} />
        <SocialCopyBlock label={labels.shortForm} copy={props.metadata.shortForm} musicCredit={props.musicCredit} labels={labels} />
      </CardContent>
    </Card>
  );
}

function SocialCopyBlock(props: {
  label: string;
  copy: PresetVideoSocialCopy;
  musicCredit?: string;
  labels: (typeof UI_COPY)[PresetVideoLanguage];
}) {
  const { label, copy, labels } = props;
  const fullCopy = [
    copy.title,
    "",
    copy.description,
    "",
    copy.hashtags.join(" "),
    "",
    `${labels.keywords}: ${copy.keywords.join(", ")}`,
    copy.pinnedComment ? `${labels.pinnedComment}: ${copy.pinnedComment}` : "",
    props.musicCredit ? `${labels.musicCredit}: ${props.musicCredit}` : "",
  ].filter(Boolean).join("\n");

  return (
    <section className="space-y-2 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{label}</p>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => void copyText(fullCopy, labels)}
        >
          <Clipboard className="mr-2 h-3.5 w-3.5" />
          {labels.copy}
        </Button>
      </div>
      <p className="text-sm font-semibold leading-5">{copy.title}</p>
      <p className="max-h-28 overflow-auto whitespace-pre-wrap text-xs leading-5 text-muted-foreground">
        {copy.description}
      </p>
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>{copy.hashtags.join(" ")}</span>
      </div>
      <p className="text-[11px] leading-5 text-muted-foreground">
        <span className="font-medium text-foreground/80">{labels.keywords}:</span> {copy.keywords.join(", ")}
      </p>
      {copy.pinnedComment ? (
        <p className="rounded-md bg-background/60 p-2 text-[11px] leading-5 text-muted-foreground">
          <span className="font-medium text-foreground/80">{labels.pinnedComment}:</span> {copy.pinnedComment}
        </p>
      ) : null}
      {props.musicCredit ? (
        <p className="rounded-md bg-background/60 p-2 text-[11px] leading-5 text-muted-foreground">
          <span className="font-medium text-foreground/80">{labels.musicCredit}:</span> {props.musicCredit}
        </p>
      ) : null}
    </section>
  );
}

async function copyText(value: string, labels: (typeof UI_COPY)[PresetVideoLanguage]) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(labels.copied);
  } catch {
    toast.error(labels.copyFailed);
  }
}
