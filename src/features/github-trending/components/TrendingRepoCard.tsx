import { CheckCircle2, ExternalLink, GitFork, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GithubTrendingRepo } from "../types";

export function TrendingRepoCard({ repo, selected, onToggle }: { repo: GithubTrendingRepo; selected: boolean; onToggle: () => void }) {
  return (
    <article className={`grid gap-3 rounded-xl border p-4 transition ${selected ? "border-cyan-400/60 bg-cyan-500/10 shadow-[0_0_28px_rgba(34,211,238,0.14)]" : "border-border/70 bg-card/40 hover:border-primary/45"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold">{repo.fullName}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{repo.description}</p>
        </div>
        {selected ? <CheckCircle2 className="h-5 w-5 shrink-0 text-cyan-300" /> : null}
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="secondary">{repo.language}</Badge>
        <Badge variant="outline"><Star className="mr-1 h-3 w-3" />{repo.stars.toLocaleString("en-US")}</Badge>
        <Badge variant="outline"><GitFork className="mr-1 h-3 w-3" />{repo.forks.toLocaleString("en-US")}</Badge>
        {repo.topics.slice(0, 3).map((topic) => <Badge key={topic} variant="outline">#{topic}</Badge>)}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant={selected ? "default" : "outline"} onClick={onToggle}>{selected ? "Đã chọn" : "Chọn cho video"}</Button>
        <Button asChild type="button" size="sm" variant="ghost">
          <a href={repo.url} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" />GitHub</a>
        </Button>
      </div>
    </article>
  );
}
