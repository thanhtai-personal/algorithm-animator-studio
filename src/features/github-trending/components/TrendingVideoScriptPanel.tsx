import { Copy, FileText, Tags } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { GithubTrendingVideoPlan } from "../types";

export function TrendingVideoScriptPanel({ plan }: { plan: GithubTrendingVideoPlan }) {
  async function copyText(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    toast.success(`Đã copy ${label}`);
  }

  return (
    <Card className="border-border/70 bg-card/70">
      <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
        <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-cyan-300" /> Script & metadata</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={() => copyText(`${plan.title}\n\n${plan.narration}\n\n${plan.description}`, "script")}> 
          <Copy className="mr-2 h-4 w-4" /> Copy
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2 rounded-lg border border-border/70 bg-muted/20 p-3">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Title</span>
          <p className="font-semibold">{plan.title}</p>
          <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold">Narration</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => copyText(plan.narration, "narration")}>Copy narration</Button>
          </div>
          <Textarea readOnly value={plan.narration} rows={8} className="font-mono text-xs leading-5" />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold"><Tags className="h-4 w-4" /> Tags</div>
          <div className="flex flex-wrap gap-2">{plan.tags.slice(0, 18).map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}</div>
        </div>
      </CardContent>
    </Card>
  );
}
