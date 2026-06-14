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
  const runningIndex = steps.findIndex((step) => step.status === "running");
  const nodes = useMemo<Node<StageNodeData>[]>(() => steps.map((step, index) => ({
    id: step.id,
    type: "stageNode",
    position: { x: index * 250, y: index % 2 === 0 ? 20 : 180 },
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
    animated: index === runningIndex || index === runningIndex - 1,
    className: index === runningIndex || index === runningIndex - 1 ? "kai-agent-running-edge" : undefined,
    markerEnd: { type: MarkerType.ArrowClosed, color: index === runningIndex || index === runningIndex - 1 ? "var(--kai-agent-active)" : undefined },
    type: "smoothstep",
    style: index === runningIndex || index === runningIndex - 1 ? { strokeWidth: 4, stroke: "var(--kai-agent-active)" } : { strokeWidth: 1.5 },
  })), [steps, runningIndex]);
  const runningStep = steps.find((step) => step.status === "running");

  return (
    <Card className="kai-agent-flow-card overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-base">{text(lang, "Live React Flow pipeline", "Sơ đồ luồng chạy real-time")}</CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant={job?.status === "success" ? "default" : job?.status === "failed" ? "destructive" : "secondary"}>{job?.status || "idle"}</Badge>
            {runningStep ? <span className="flex items-center gap-1 text-[var(--kai-agent-active)]"><span className="h-2 w-2 animate-pulse rounded-full bg-[var(--kai-agent-active)] shadow-[0_0_10px_var(--kai-agent-active)]" />{runningStep.label}</span> : null}
            <span>{Math.round(job?.progress || 0)}%</span>
            <button type="button" className="underline-offset-4 hover:underline" onClick={() => onSelectStage("all")}>{text(lang, "All logs", "Tất cả log")}</button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="kai-agent-flow-shell h-[520px] overflow-hidden rounded-xl border bg-muted/20">
          <style>{`
            .kai-agent-flow-card {
              --kai-agent-active: #0284c7;
              --kai-agent-active-soft: rgba(2, 132, 199, 0.2);
              --kai-agent-active-glow: rgba(2, 132, 199, 0.65);
            }

            .dark .kai-agent-flow-card {
              --kai-agent-active: #fb923c;
              --kai-agent-active-soft: rgba(251, 146, 60, 0.18);
              --kai-agent-active-glow: rgba(251, 146, 60, 0.8);
            }

            .kai-agent-running-edge .react-flow__edge-path {
              stroke-dasharray: 12 8;
              animation: kai-agent-flow-dash 0.7s linear infinite;
              filter: drop-shadow(0 0 7px var(--kai-agent-active-glow));
            }

            @keyframes kai-agent-flow-dash {
              from { stroke-dashoffset: 20; }
              to { stroke-dashoffset: 0; }
            }
          `}</style>
          <ReactFlow
            key={`${job?.id || "empty"}-${job?.updatedAtMs || 0}-${runningStep?.id || "idle"}`}
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
      </CardContent>
    </Card>
  );
}

function StageNode({ data }: NodeProps<Node<StageNodeData>>) {
  const running = data.status === "running";
  return (
    <div className={cn("relative w-56 overflow-hidden rounded-xl border bg-background p-3 shadow-sm transition", data.selected && "border-primary ring-2 ring-primary/20", running && "border-[var(--kai-agent-active)] bg-[var(--kai-agent-active-soft)] shadow-[0_0_24px_var(--kai-agent-active-glow)] ring-2 ring-[var(--kai-agent-active)]/30")}>
      {running ? <div className="absolute inset-x-0 top-0 h-1 animate-pulse bg-[var(--kai-agent-active)] shadow-[0_0_14px_var(--kai-agent-active)]" /> : null}
      <Handle type="target" position={Position.Left} className="!h-2 !w-2" />
      <div className="flex items-start gap-2">
        <StatusIcon status={data.status} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{data.label}</p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{data.message || "Waiting"}</p>
        </div>
      </div>
      {running ? <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-[var(--kai-agent-active)]"><span className="h-2 w-2 animate-ping rounded-full bg-[var(--kai-agent-active)]" />Live signal</div> : null}
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", data.status === "failed" ? "bg-destructive" : data.status === "done" ? "bg-primary" : running ? "animate-pulse bg-[var(--kai-agent-active)] shadow-[0_0_10px_var(--kai-agent-active)]" : "bg-muted-foreground")} style={{ width: `${Math.max(0, Math.min(100, data.progress || 0))}%` }} />
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

function fallbackSteps() {
  return ["Research", "Strategy", "Script", "Visual", "Voice", "Render", "Metadata", "Publish", "Engage", "Monetize"].map((label, index) => ({
    id: ["research", "strategy", "script", "visuals", "voice", "render", "metadata", "publish", "engage", "monetize"][index] as AgentWorkflowStageId,
    label,
    status: "pending",
    progress: 0,
    message: "",
  }));
}
