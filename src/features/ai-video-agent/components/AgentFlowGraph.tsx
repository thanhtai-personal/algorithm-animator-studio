import { useMemo } from "react";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CheckCircle2, Circle, Clock3, Loader2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AgentVideoJob, AgentWorkflowStageId } from "@/lib/aiVideoAgentApi";
import { text, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type StageNodeData = {
  label: string;
  status: string;
  progress: number;
  message?: string;
  selected: boolean;
  logCount: number;
};

const nodeTypes = { stageNode: StageNode };

export function AgentFlowGraph({
  job,
  lang,
  selectedStageId,
  onSelectStage,
}: {
  job?: AgentVideoJob;
  lang: Lang;
  selectedStageId: AgentWorkflowStageId | "all";
  onSelectStage: (stageId: AgentWorkflowStageId | "all") => void;
}) {
  const steps = job?.steps?.length ? job.steps : fallbackSteps();
  const logs = job?.logs || [];
  const selectedLogs = selectedStageId === "all" ? logs : logs.filter((log) => log.stageId === selectedStageId);
  const nodes = useMemo<Node<StageNodeData>[]>(() => steps.map((step, index) => ({
    id: step.id,
    type: "stageNode",
    position: { x: index * 220, y: index % 2 === 0 ? 0 : 130 },
    data: {
      label: step.label,
      status: step.status,
      progress: step.progress,
      message: step.message,
      selected: selectedStageId === step.id,
      logCount: logs.filter((log) => log.stageId === step.id).length,
    },
  })), [steps, selectedStageId, logs]);
  const edges = useMemo<Edge[]>(() => steps.slice(0, -1).map((step, index) => ({
    id: `${step.id}-${steps[index + 1].id}`,
    source: step.id,
    target: steps[index + 1].id,
    animated: step.status === "running" || steps[index + 1].status === "running",
    markerEnd: { type: MarkerType.ArrowClosed },
    type: "smoothstep",
  })), [steps]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-base">{text(lang, "Live React Flow pipeline", "Sơ đồ luồng chạy real-time")}</CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant={job?.status === "success" ? "default" : job?.status === "failed" ? "destructive" : "secondary"}>{job?.status || "idle"}</Badge>
            <span>{Math.round(job?.progress || 0)}%</span>
            <button type="button" className="underline-offset-4 hover:underline" onClick={() => onSelectStage("all")}>{text(lang, "All logs", "Tất cả log")}</button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="h-[360px] overflow-hidden rounded-xl border bg-muted/20">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.18 }}
            minZoom={0.25}
            maxZoom={1.4}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
            onNodeClick={(_event, node) => onSelectStage(node.id as AgentWorkflowStageId)}
          >
            <Background gap={18} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
        <div className="rounded-xl border bg-card">
          <div className="border-b p-3">
            <p className="text-sm font-semibold">{selectedTitle(steps, selectedStageId, lang)}</p>
            <p className="text-xs text-muted-foreground">{text(lang, "Click a node to inspect only that step's logs.", "Click vào node để xem riêng log của bước đó.")}</p>
          </div>
          <ScrollArea className="h-[300px] p-3">
            {selectedLogs.length ? selectedLogs.map((log) => (
              <div key={log.id} className="mb-2 rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={log.level === "error" ? "destructive" : log.level === "success" ? "default" : "outline"}>{log.level}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(log.atMs).toLocaleTimeString()}</span>
                </div>
                <p className="mt-2 text-muted-foreground">{log.message}</p>
              </div>
            )) : <p className="text-sm text-muted-foreground">{text(lang, "No logs for this node yet.", "Node này chưa có log.")}</p>}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

function StageNode({ data }: NodeProps<Node<StageNodeData>>) {
  return (
    <div className={cn("w-48 rounded-xl border bg-background p-3 shadow-sm transition", data.selected && "border-primary ring-2 ring-primary/20")}>
      <Handle type="target" position={Position.Left} className="!h-2 !w-2" />
      <div className="flex items-start gap-2">
        <StatusIcon status={data.status} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{data.label}</p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{data.message || "Waiting"}</p>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", data.status === "failed" ? "bg-destructive" : data.status === "done" ? "bg-primary" : "bg-muted-foreground")} style={{ width: `${Math.max(0, Math.min(100, data.progress || 0))}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{data.status}</span>
        <span>{data.logCount} logs</span>
      </div>
      <Handle type="source" position={Position.Right} className="!h-2 !w-2" />
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "running") return <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-primary" />;
  if (status === "done") return <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />;
  if (status === "failed") return <XCircle className="mt-0.5 h-4 w-4 text-destructive" />;
  if (status === "skipped") return <Clock3 className="mt-0.5 h-4 w-4 text-muted-foreground" />;
  return <Circle className="mt-0.5 h-4 w-4 text-muted-foreground" />;
}

function selectedTitle(steps: Array<{ id: string; label: string }>, selected: string, lang: Lang) {
  if (selected === "all") return text(lang, "All job logs", "Tất cả log của job");
  return steps.find((step) => step.id === selected)?.label || selected;
}

function fallbackSteps() {
  return ["Research", "Strategy", "Script", "Visual", "Voice", "Render", "Metadata", "Publish", "Engage", "Monetize"].map((label, index) => ({
    id: ["research", "strategy", "script", "visuals", "voice", "render", "metadata", "publish", "engage", "monetize"][index] as AgentWorkflowStageId,
    label,
    status: "pending",
    progress: 0,
    message: "",
  }));
}
