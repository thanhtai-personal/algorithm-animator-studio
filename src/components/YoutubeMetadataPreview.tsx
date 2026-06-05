import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { text, type Lang } from "@/lib/i18n";
import { appendYoutubeDescriptionCredit, buildYoutubeMetadata, type YoutubeAlgorithmMetadata } from "@/lib/youtubeMetadata";
import type { LongVideoType } from "@/lib/longVideoTypes";

type Props = {
  algoId: string;
  lang: Lang;
  variant: "short" | "long";
  longVideoType?: LongVideoType;
  musicLicenseText?: string;
  metadata?: YoutubeAlgorithmMetadata;
};

export function YoutubeMetadataPreview({ algoId, lang, variant, longVideoType = "classic", musicLicenseText, metadata: providedMetadata }: Props) {
  const metadata = providedMetadata ?? buildYoutubeMetadata(algoId, lang, variant, longVideoType);
  const description = appendYoutubeDescriptionCredit(metadata.description, musicLicenseText, lang);

  return (
    <Card className="space-y-3 border-border/70 p-4">
      <div>
        <h2 className="font-semibold">{text(lang, "YouTube metadata", "Metadata YouTube")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {text(lang, "Use these for the upload title, description and tags.", "Dùng cho 3 field khi đăng video.")}
        </p>
      </div>
      <MetadataField lang={lang} label={text(lang, "Title", "Tiêu đề")} value={metadata.title} />
      <MetadataField lang={lang} label={text(lang, "Description", "Mô tả")} value={description} rows={9} />
      <MetadataField lang={lang} label={text(lang, "Tags", "Thẻ tag")} value={metadata.tags} rows={3} />
      {musicLicenseText?.trim() ? <p className="text-xs text-yellow-300">{text(lang, "Music license has been added to the description.", "Bản quyền nhạc đã được thêm vào cuối description.")}</p> : null}
    </Card>
  );
}

function MetadataField(props: { lang: Lang; label: string; value: string; rows?: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <Label>{props.label}</Label>
        <button type="button" className="inline-flex items-center gap-1 text-xs text-emerald-300 hover:text-emerald-200" onClick={() => copyText(props.value, props.lang)}>
          <Copy className="h-3.5 w-3.5" /> {text(props.lang, "Copy", "Copy")}
        </button>
      </div>
      <Textarea readOnly rows={props.rows ?? 2} value={props.value} className="resize-y bg-background/60 text-xs" />
    </div>
  );
}

function copyText(value: string, lang: Lang) {
  void navigator.clipboard.writeText(value).then(
    () => toast.success(text(lang, "Metadata copied.", "Đã copy metadata.")),
    () => toast.error(text(lang, "Could not copy metadata.", "Không copy được metadata.")),
  );
}
