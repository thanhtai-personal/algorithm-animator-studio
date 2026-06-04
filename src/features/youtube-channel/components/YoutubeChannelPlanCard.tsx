import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Lang } from "@/lib/i18n";
import { createIdea } from "../channelPlanStorage";
import type { ChannelIdea, YoutubeChannelPlan } from "../types";

type Props = {
  plan: YoutubeChannelPlan;
  setPlan: (patch: Partial<YoutubeChannelPlan>) => void;
  lang: Lang;
};

export function YoutubeChannelPlanCard({ lang, plan, setPlan }: Props) {
  const vi = lang === "vi";
  function updateIdea(id: string, patch: Partial<ChannelIdea>) {
    setPlan({ ideas: plan.ideas.map((idea) => idea.id === id ? { ...idea, ...patch } : idea) });
  }

  function removeIdea(id: string) {
    setPlan({ ideas: plan.ideas.filter((idea) => idea.id !== id) });
  }

  return (
    <Card className="space-y-4 p-4">
      <div>
        <h2 className="font-semibold">{txt(vi, "Kế hoạch quản lý kênh", "Channel Management Plan")}</h2>
        <p className="text-xs text-muted-foreground">{txt(vi, "Lưu local để thống nhất định vị, lịch đăng, tag mặc định và backlog ý tưởng.", "Saved locally to align positioning, posting cadence, default tags, and the idea backlog.")}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Channel URL" value={plan.channelUrl} onChange={(value) => setPlan({ channelUrl: value })} />
        <Field label={txt(vi, "Nhịp upload", "Upload cadence")} value={plan.uploadCadence} onChange={(value) => setPlan({ uploadCadence: value })} />
      </div>
      <Field label={txt(vi, "Đối tượng mục tiêu", "Target audience")} value={plan.targetAudience} onChange={(value) => setPlan({ targetAudience: value })} />
      <Area label={txt(vi, "Trụ cột nội dung", "Content pillars")} value={plan.contentPillars} onChange={(value) => setPlan({ contentPillars: value })} />
      <Area label={txt(vi, "Tag mặc định", "Default tags")} value={plan.defaultTags} onChange={(value) => setPlan({ defaultTags: value })} />
      <Field label={txt(vi, "Mẫu bình luận ghim", "Pinned comment template")} value={plan.pinnedComment} onChange={(value) => setPlan({ pinnedComment: value })} />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">{txt(vi, "Backlog ý tưởng", "Idea backlog")}</h3>
          <Button size="sm" variant="outline" onClick={() => setPlan({ ideas: [createIdea(), ...plan.ideas] })}>
            <Plus className="mr-2 h-4 w-4" />{txt(vi, "Thêm ý tưởng", "Add idea")}
          </Button>
        </div>
        {plan.ideas.map((idea) => (
          <div key={idea.id} className="grid gap-2 rounded-lg border border-border p-3 md:grid-cols-[1fr_120px_140px_auto]">
            <Input value={idea.title} onChange={(event) => updateIdea(idea.id, { title: event.target.value })} />
            <Select value={idea.format} onValueChange={(value) => updateIdea(idea.id, { format: value as ChannelIdea["format"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short</SelectItem>
                <SelectItem value="long">Long</SelectItem>
                <SelectItem value="series">Series</SelectItem>
              </SelectContent>
            </Select>
            <Select value={idea.status} onValueChange={(value) => updateIdea(idea.id, { status: value as ChannelIdea["status"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="idea">Idea</SelectItem>
                <SelectItem value="script">Script</SelectItem>
                <SelectItem value="recording">Recording</SelectItem>
                <SelectItem value="uploaded">Uploaded</SelectItem>
              </SelectContent>
            </Select>
            <Button size="icon" variant="ghost" onClick={() => removeIdea(idea.id)} aria-label={txt(vi, "Xóa ý tưởng", "Delete idea")}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Field(props: { label: string; value: string; onChange: (value: string) => void }) {
  return <div><Label>{props.label}</Label><Input className="mt-2" value={props.value} onChange={(event) => props.onChange(event.target.value)} /></div>;
}

function Area(props: { label: string; value: string; onChange: (value: string) => void }) {
  return <div><Label>{props.label}</Label><Textarea className="mt-2 min-h-24" value={props.value} onChange={(event) => props.onChange(event.target.value)} /></div>;
}

function txt(vi: boolean, viText: string, enText: string) {
  return vi ? viText : enText;
}
