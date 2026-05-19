import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { appendYoutubeDescriptionCredit, buildYoutubeMetadata } from "@/lib/youtubeMetadata";
import type { Lang } from "@/lib/i18n";
import type { LongVideoType } from "@/lib/longVideoTypes";

type Props = {
  algoId: string;
  lang: Lang;
  variant: "short" | "long";
  longVideoType?: LongVideoType;
  musicLicenseText?: string;
};

export function YoutubeMetadataPreview({ algoId, lang, variant, longVideoType = "classic", musicLicenseText }: Props) {
  const metadata = buildYoutubeMetadata(algoId, lang, variant, longVideoType);
  const description = appendYoutubeDescriptionCredit(metadata.description, musicLicenseText, lang);

  return (
    <Card className="space-y-3 border-border/70 p-4">
      <div>
        <h2 className="font-semibold">YouTube metadata</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {lang === "vi" ? "Dùng cho 3 field khi đăng video." : "Use these for the upload title, description and tags."}
        </p>
      </div>
      <MetadataField label="Title" value={metadata.title} />
      <MetadataField label="Description" value={description} rows={9} />
      <MetadataField label="Tags" value={metadata.tags} rows={3} />
      {musicLicenseText?.trim() ? <p className="text-xs text-yellow-300">{lang === "vi" ? "Bản quyền nhạc đã được thêm vào cuối description." : "Music license has been added to the description."}</p> : null}
    </Card>
  );
}

function MetadataField(props: { label: string; value: string; rows?: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <Label>{props.label}</Label>
        <button type="button" className="inline-flex items-center gap-1 text-xs text-emerald-300 hover:text-emerald-200" onClick={() => copyText(props.value)}>
          <Copy className="h-3.5 w-3.5" /> Copy
        </button>
      </div>
      <Textarea readOnly rows={props.rows ?? 2} value={props.value} className="resize-y bg-background/60 text-xs" />
    </div>
  );
}

function copyText(value: string) {
  void navigator.clipboard.writeText(value).then(
    () => toast.success("Đã copy metadata."),
    () => toast.error("Không copy được metadata."),
  );
}
