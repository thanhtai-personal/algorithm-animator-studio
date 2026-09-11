import { Clipboard, Hash, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PresetVideoSocialCopy, PresetVideoSocialMetadata } from "../types";

export function PresetVideoSocialMetadataCard(props: {
  metadata: PresetVideoSocialMetadata;
  musicCredit?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Search className="h-4 w-4" />
          Social SEO
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SocialCopyBlock label="YouTube / Facebook video" copy={props.metadata.longForm} musicCredit={props.musicCredit} />
        <SocialCopyBlock label="Short / Reel" copy={props.metadata.shortForm} musicCredit={props.musicCredit} />
      </CardContent>
    </Card>
  );
}

function SocialCopyBlock(props: {
  label: string;
  copy: PresetVideoSocialCopy;
  musicCredit?: string;
}) {
  const { label, copy } = props;
  const fullCopy = [
    copy.title,
    "",
    copy.description,
    "",
    copy.hashtags.join(" "),
    "",
    `Keywords: ${copy.keywords.join(", ")}`,
    copy.pinnedComment ? `Pinned comment: ${copy.pinnedComment}` : "",
    props.musicCredit ? `Music credit: ${props.musicCredit}` : "",
  ].filter(Boolean).join("\n");

  return (
    <section className="space-y-2 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{label}</p>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => void copyText(fullCopy)}
        >
          <Clipboard className="mr-2 h-3.5 w-3.5" />
          Copy
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
        <span className="font-medium text-foreground/80">Keywords:</span> {copy.keywords.join(", ")}
      </p>
      {copy.pinnedComment ? (
        <p className="rounded-md bg-background/60 p-2 text-[11px] leading-5 text-muted-foreground">
          <span className="font-medium text-foreground/80">Pinned comment:</span> {copy.pinnedComment}
        </p>
      ) : null}
      {props.musicCredit ? (
        <p className="rounded-md bg-background/60 p-2 text-[11px] leading-5 text-muted-foreground">
          <span className="font-medium text-foreground/80">Music credit:</span> {props.musicCredit}
        </p>
      ) : null}
    </section>
  );
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success("Đã copy bộ social SEO.");
  } catch {
    toast.error("Không copy được. Hãy chọn nội dung và copy thủ công.");
  }
}
