import { useMemo, useState } from "react";
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

type FlowNodeKind = "stage" | "condition" | "branch" | "terminal" | "data";
type FlowMode = "process" | "data";

type StageNodeData = {
  label: string;
  status: string;
  progress: number;
  message?: string;
  selected: boolean;
  logCount: number;
  kind: FlowNodeKind;
  stageId?: AgentWorkflowStageId;
};

type AgentStep = NonNullable<AgentVideoJob["steps"]>[number];

type FlowSpecNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  kind?: FlowNodeKind;
  stageId?: AgentWorkflowStageId;
  status?: string;
  progress?: number;
  message?: string;
};

type FlowSpecEdge = { source: string; target: string; active?: boolean; skipped?: boolean; label?: string; sourceHandle?: string; targetHandle?: string };

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
  const [mode, setMode] = useState<FlowMode>("process");
  const steps = job?.steps?.length ? job.steps : fallbackSteps();
  const logs = job?.logs || [];
  const flow = useMemo(() => buildAgentFlow(job, steps, lang, mode), [job, steps, lang, mode]);
  const nodes = useMemo<Node<StageNodeData>[]>(() => flow.nodes.map((node) => {
    const step = node.stageId ? steps.find((item) => item.id === node.stageId) : undefined;
    const status = node.status || step?.status || "pending";
    return {
      id: node.id,
      type: "stageNode",
      position: { x: node.x, y: node.y },
      data: {
        label: node.label,
        status,
        progress: node.progress ?? step?.progress ?? 0,
        message: node.message ?? step?.message,
        selected: Boolean(node.stageId && selectedStageId === node.stageId),
        logCount: node.stageId ? logs.filter((log) => log.stageId === node.stageId).length : 0,
        kind: node.kind || "stage",
        stageId: node.stageId,
      },
    };
  }), [flow.nodes, steps, selectedStageId, logs]);
  const edges = useMemo<Edge[]>(() => flow.edges.map((edge) => ({
    id: `${edge.source}-${edge.target}`,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle || "source-right",
    targetHandle: edge.targetHandle || "target-left",
    animated: edge.active,
    className: edge.active ? "kai-agent-running-edge" : edge.skipped ? "kai-agent-skipped-edge" : undefined,
    label: edge.label,
    markerEnd: { type: MarkerType.ArrowClosed, color: edge.active ? "var(--kai-agent-active)" : edge.skipped ? "var(--kai-agent-skip)" : "var(--kai-agent-done)" },
    type: "smoothstep",
    style: edge.active
      ? { strokeWidth: 4.5, stroke: "var(--kai-agent-active)" }
      : edge.skipped
        ? { strokeWidth: 1.5, stroke: "var(--kai-agent-skip)", opacity: 0.42 }
        : { strokeWidth: 2, stroke: "var(--kai-agent-done)", opacity: 0.82 },
  })), [flow.edges]);
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
            {(["process", "data"] as FlowMode[]).map((item) => <button key={item} type="button" className={cn("rounded-md border px-2 py-1", mode === item && "border-[var(--kai-agent-active)] bg-[var(--kai-agent-active-soft)] text-[var(--kai-agent-active)]")} onClick={() => setMode(item)}>{item === "process" ? text(lang, "Process flow", "Sơ đồ xử lý") : text(lang, "Data flow", "Sơ đồ dữ liệu")}</button>)}
            <button type="button" className="underline-offset-4 hover:underline" onClick={() => onSelectStage("all")}>{text(lang, "All logs", "Tất cả log")}</button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="kai-agent-flow-shell h-[680px] overflow-hidden rounded-xl border bg-muted/20 xl:h-[720px]">
          <style>{`
            .kai-agent-flow-card {
              --kai-agent-active: #0284c7;
              --kai-agent-active-soft: rgba(2, 132, 199, 0.2);
              --kai-agent-active-glow: rgba(2, 132, 199, 0.65);
              --kai-agent-done: #059669;
              --kai-agent-done-soft: rgba(5, 150, 105, 0.14);
              --kai-agent-skip: #64748b;
              --kai-agent-skip-soft: rgba(100, 116, 139, 0.12);
              --kai-agent-process-bg: rgba(255, 255, 255, 0.96);
              --kai-agent-terminal-bg: rgba(241, 245, 249, 0.98);
              --kai-agent-decision: #f97316;
              --kai-agent-decision-soft: rgba(249, 115, 22, 0.14);
              --kai-agent-decision-glow: rgba(249, 115, 22, 0.45);
              --kai-agent-data: #2563eb;
              --kai-agent-data-soft: rgba(37, 99, 235, 0.12);
            }
            .dark .kai-agent-flow-card {
              --kai-agent-active: #fb923c;
              --kai-agent-active-soft: rgba(251, 146, 60, 0.18);
              --kai-agent-active-glow: rgba(251, 146, 60, 0.8);
              --kai-agent-done: #22c55e;
              --kai-agent-done-soft: rgba(34, 197, 94, 0.13);
              --kai-agent-skip: #475569;
              --kai-agent-skip-soft: rgba(71, 85, 105, 0.2);
              --kai-agent-process-bg: rgba(2, 6, 23, 0.92);
              --kai-agent-terminal-bg: rgba(15, 23, 42, 0.96);
              --kai-agent-decision: #fb923c;
              --kai-agent-decision-soft: rgba(251, 146, 60, 0.18);
              --kai-agent-decision-glow: rgba(251, 146, 60, 0.75);
              --kai-agent-data: #38bdf8;
              --kai-agent-data-soft: rgba(56, 189, 248, 0.14);
            }
            .kai-agent-running-edge .react-flow__edge-path { stroke-dasharray: 12 8; animation: kai-agent-flow-dash 0.7s linear infinite; filter: drop-shadow(0 0 7px var(--kai-agent-active-glow)); }
            .kai-agent-skipped-edge .react-flow__edge-path { stroke-dasharray: 4 8; filter: grayscale(1); }
            .kai-agent-skipped-edge .react-flow__edge-text,
            .kai-agent-skipped-edge .react-flow__edge-textbg { opacity: 0.55; }
            @keyframes kai-agent-flow-dash { from { stroke-dashoffset: 20; } to { stroke-dashoffset: 0; } }
          `}</style>
          <ReactFlow
            key={`${mode}-${job?.id || "empty"}-${job?.updatedAtMs || 0}-${runningStep?.id || "idle"}-${job?.input?.agentPreset || "custom"}`}
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.14 }}
            minZoom={0.2}
            maxZoom={1.4}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
            onNodeClick={(_event, node) => {
              const stageId = node.data.stageId;
              if (stageId) onSelectStage(stageId);
            }}
          >
            <Background gap={18} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      </CardContent>
    </Card>
  );
}

function buildAgentFlow(job: AgentVideoJob | undefined, steps: AgentStep[], lang: Lang, mode: FlowMode) {
  if (mode === "data") return buildAgentDataFlow(job, steps, lang);
  const vi = lang === "vi";
  const labels = getAgentLabels(job?.input?.agentPreset || "custom", vi);
  const hasPlan = Boolean(job?.plan);
  const fallback = Boolean(job?.plan?.warning);
  const hasApiKeyPath = hasPlan && !fallback;
  const publishStep = steps.find((step) => step.id === "publish");
  const autoPublish = Boolean(job?.input?.autoCreatePublishJobs);
  const runningId = steps.find((step) => step.status === "running")?.id;
  const node = (id: string, label: string, x: number, y: number, stageId?: AgentWorkflowStageId, extra?: Partial<FlowSpecNode>): FlowSpecNode => ({ id, label, x, y, stageId, ...extra });
  const nodes: FlowSpecNode[] = [
    node("start", vi ? "Bắt đầu" : "Start", -260, 220, undefined, { kind: "terminal", status: job ? "done" : "pending", progress: job ? 100 : 0 }),
    node("research", labels.research, 0, 220, "research"),
    node("api-check", vi ? "Có API key?" : "API key?", 250, 220, "research", { kind: "condition", status: conditionStatus(steps, "research"), progress: hasPlan ? 100 : 0, message: apiMessage(job, vi) }),
    node("ai-plan", vi ? "AI plan" : "AI plan", 500, 40, "research", { kind: "branch", status: branchStatus(hasApiKeyPath, fallback, runningId === "research"), progress: hasApiKeyPath ? 100 : 0, message: labels.aiPlan }),
    node("fallback-plan", vi ? "Fallback local" : "Local fallback", 500, 400, "research", { kind: "branch", status: branchStatus(fallback, hasApiKeyPath, runningId === "research"), progress: fallback ? 100 : 0, message: job?.plan?.warning || labels.fallback }),
    node("strategy", labels.strategy, 770, 220, "strategy"),
    node("script", labels.script, 1030, 220, "script"),
    node("visuals", labels.visuals, 1290, 55, "visuals"),
    node("voice", labels.voice, 1290, 390, "voice"),
    node("render", labels.render, 1550, 220, "render"),
    node("metadata", labels.metadata, 1810, 105, "metadata"),
    node("publish-check", vi ? "Auto publish?" : "Auto publish?", 2060, 220, "publish", { kind: "condition", status: conditionStatus(steps, "metadata"), progress: publishStep?.progress || 0, message: autoPublish ? labels.publishYes : labels.publishNo }),
    node("publish", labels.publish, 2310, 40, "publish"),
    node("local-output", vi ? "Lưu local" : "Local output", 2310, 400, "publish", { kind: "branch", status: publishStep?.status === "skipped" ? "done" : autoPublish ? "skipped" : publishStep?.status || "pending", progress: publishStep?.status === "skipped" ? 100 : 0, message: labels.publishNo }),
    node("engage", labels.engage, 2570, 105, "engage"),
    node("monetize", labels.monetize, 2830, 285, "monetize"),
    node("end", vi ? "Kết thúc" : "End", 3090, 285, undefined, { kind: "terminal", status: job?.status === "success" ? "done" : job?.status === "failed" ? "failed" : "pending", progress: job?.status === "success" ? 100 : 0, message: job?.status === "failed" ? job.error : "" }),
  ];
  const active = (source: AgentWorkflowStageId, target?: AgentWorkflowStageId) => runningId === source || runningId === target;
  const edges: FlowSpecEdge[] = [
    { source: "start", target: "research", active: runningId === "research" },
    { source: "research", target: "api-check", active: runningId === "research" },
    { source: "api-check", target: "ai-plan", active: runningId === "research" && !fallback, skipped: fallback, label: vi ? "có" : "yes", sourceHandle: "source-top", targetHandle: "target-left" },
    { source: "api-check", target: "fallback-plan", active: runningId === "research" && fallback, skipped: hasApiKeyPath, label: vi ? "không" : "no", sourceHandle: "source-bottom", targetHandle: "target-left" },
    { source: "ai-plan", target: "strategy", active: hasApiKeyPath && active("research", "strategy"), skipped: fallback },
    { source: "fallback-plan", target: "strategy", active: fallback && active("research", "strategy"), skipped: hasApiKeyPath },
    { source: "strategy", target: "script", active: active("strategy", "script") },
    { source: "script", target: "visuals", active: active("script", "visuals"), sourceHandle: "source-top", targetHandle: "target-left" },
    { source: "visuals", target: "voice", active: active("visuals", "voice"), sourceHandle: "source-bottom", targetHandle: "target-top" },
    { source: "voice", target: "render", active: active("voice", "render"), sourceHandle: "source-right", targetHandle: "target-bottom" },
    { source: "render", target: "metadata", active: active("render", "metadata"), sourceHandle: "source-top", targetHandle: "target-left" },
    { source: "metadata", target: "publish-check", active: active("metadata", "publish") },
    { source: "publish-check", target: "publish", active: autoPublish && runningId === "publish", skipped: !autoPublish, label: vi ? "bật" : "on", sourceHandle: "source-top", targetHandle: "target-left" },
    { source: "publish-check", target: "local-output", active: !autoPublish && runningId === "publish", skipped: autoPublish, label: vi ? "tắt" : "off", sourceHandle: "source-bottom", targetHandle: "target-left" },
    { source: "publish", target: "engage", active: autoPublish && active("publish", "engage"), skipped: !autoPublish, sourceHandle: "source-right", targetHandle: "target-top" },
    { source: "local-output", target: "engage", active: !autoPublish && active("publish", "engage"), skipped: autoPublish, sourceHandle: "source-right", targetHandle: "target-bottom" },
    { source: "engage", target: "monetize", active: active("engage", "monetize") },
    { source: "monetize", target: "end", active: active("monetize") },
  ];
  return { nodes, edges };
}

function buildAgentDataFlow(job: AgentVideoJob | undefined, steps: AgentStep[], lang: Lang) {
  const vi = lang === "vi";
  const runningId = steps.find((step) => step.status === "running")?.id;
  const fallback = Boolean(job?.plan?.warning);
  const hasApiKeyPath = Boolean(job?.plan && !fallback);
  const autoPublish = Boolean(job?.input?.autoCreatePublishJobs);
  const n = (id: string, label: string, x: number, y: number, stageId?: AgentWorkflowStageId, extra?: Partial<FlowSpecNode>): FlowSpecNode => ({ id, label, x, y, stageId, kind: "data", ...extra });
  const active = (source: AgentWorkflowStageId, target?: AgentWorkflowStageId) => runningId === source || runningId === target;
  return {
    nodes: [
      n("input", vi ? "Topic + Settings" : "Topic + Settings", 0, 220, "research"),
      n("api-check", vi ? "Có API key?" : "API key?", 280, 220, "research", { kind: "condition", status: conditionStatus(steps, "research") }),
      n("ai-data", vi ? "AI plan data" : "AI plan data", 560, 60, "research", { status: hasApiKeyPath ? "done" : fallback ? "skipped" : "pending" }),
      n("local-data", vi ? "Local fallback data" : "Local fallback data", 560, 380, "research", { status: fallback ? "done" : hasApiKeyPath ? "skipped" : "pending" }),
      n("plan", vi ? "Plan JSON" : "Plan JSON", 840, 220, "strategy"),
      n("script", vi ? "Narration script" : "Narration script", 1120, 220, "script"),
      n("voice", vi ? "Audio file" : "Audio file", 1400, 60, "voice"),
      n("visual", vi ? "Visual assets" : "Visual assets", 1400, 380, "visuals"),
      n("video", vi ? "MP4 video" : "MP4 video", 1680, 220, "render"),
      n("metadata", vi ? "Metadata + tags" : "Metadata + tags", 1960, 220, "metadata"),
      n("publish-check", vi ? "Auto publish?" : "Auto publish?", 2240, 220, "publish", { kind: "condition", status: conditionStatus(steps, "metadata") }),
      n("queue", vi ? "Publish payload" : "Publish payload", 2520, 60, "publish", { status: autoPublish ? "done" : "skipped" }),
      n("local", vi ? "Local output" : "Local output", 2520, 380, "publish", { status: autoPublish ? "skipped" : "done" }),
    ],
    edges: [
      { source: "input", target: "api-check", active: runningId === "research", label: vi ? "prompt + config" : "prompt + config" },
      { source: "api-check", target: "ai-data", active: runningId === "research" && !fallback, skipped: fallback, label: vi ? "có" : "yes", sourceHandle: "source-top", targetHandle: "target-left" },
      { source: "api-check", target: "local-data", active: runningId === "research" && fallback, skipped: hasApiKeyPath, label: vi ? "không" : "no", sourceHandle: "source-bottom", targetHandle: "target-left" },
      { source: "ai-data", target: "plan", active: hasApiKeyPath && active("research", "strategy"), skipped: fallback }, { source: "local-data", target: "plan", active: fallback && active("research", "strategy"), skipped: hasApiKeyPath },
      { source: "plan", target: "script", active: active("strategy", "script"), label: "scenes" }, { source: "script", target: "voice", active: active("script", "voice"), sourceHandle: "source-top", targetHandle: "target-left" }, { source: "script", target: "visual", active: active("script", "visuals"), sourceHandle: "source-bottom", targetHandle: "target-left" },
      { source: "voice", target: "video", active: active("voice", "render"), targetHandle: "target-top" }, { source: "visual", target: "video", active: active("visuals", "render"), targetHandle: "target-bottom" }, { source: "video", target: "metadata", active: active("render", "metadata") }, { source: "metadata", target: "publish-check", active: active("metadata", "publish") },
      { source: "publish-check", target: "queue", active: autoPublish && runningId === "publish", skipped: !autoPublish, label: vi ? "bật" : "on", sourceHandle: "source-top", targetHandle: "target-left" }, { source: "publish-check", target: "local", active: !autoPublish && runningId === "publish", skipped: autoPublish, label: vi ? "tắt" : "off", sourceHandle: "source-bottom", targetHandle: "target-left" },
    ] as FlowSpecEdge[],
  };
}

function conditionStatus(steps: AgentStep[], waitFor: AgentWorkflowStageId) {
  const step = steps.find((item) => item.id === waitFor);
  if (step?.status === "running") return "running";
  if (step?.status === "done" || step?.status === "skipped") return "done";
  if (step?.status === "failed") return "failed";
  return "pending";
}

function branchStatus(activeBranch: boolean, skippedBranch: boolean, parentRunning: boolean) {
  if (activeBranch) return "done";
  if (skippedBranch) return "skipped";
  return parentRunning ? "pending" : "pending";
}

function apiMessage(job: AgentVideoJob | undefined, vi: boolean) {
  if (job?.plan?.warning) return job.plan.warning;
  if (job?.plan) return vi ? "Dùng provider AI để tạo plan." : "AI provider created the plan.";
  return vi ? "Chờ kiểm tra provider/API key." : "Waiting for provider/API key check.";
}

function getAgentLabels(preset: string, vi: boolean) {
  const base = {
    research: vi ? "Research" : "Research",
    aiPlan: vi ? "Có API key: gọi AI provider." : "API key found: call AI provider.",
    fallback: vi ? "Không có API key: dùng dữ liệu local của agent." : "No API key: use local agent fallback.",
    strategy: vi ? "Strategy" : "Strategy",
    script: vi ? "Script" : "Script",
    visuals: vi ? "Visual plan" : "Visual plan",
    voice: vi ? "Voice-over" : "Voice-over",
    render: vi ? "Render" : "Render",
    metadata: vi ? "Metadata" : "Metadata",
    publish: vi ? "Publish queue" : "Publish queue",
    publishYes: vi ? "Tạo publish job cho kênh đã chọn." : "Create publish jobs for selected channels.",
    publishNo: vi ? "Không tạo queue, chỉ giữ output local." : "No queue, keep output local only.",
    engage: vi ? "Engage" : "Engage",
    monetize: vi ? "Monetize" : "Monetize",
  };
  if (preset === "mu-news") return { ...base, research: vi ? "Nguồn tin MU" : "MU sources", strategy: vi ? "Kiểm chứng tin" : "Verify news", script: vi ? "Bản tin ngắn" : "News script", visuals: vi ? "Ảnh/clip bóng đá" : "Football visuals", metadata: vi ? "Headline SEO" : "SEO headline" };
  if (preset === "story-author") return { ...base, research: vi ? "Premise" : "Premise", strategy: vi ? "Outline chương" : "Chapter outline", script: vi ? "Đoạn mở đầu" : "Opening prose", visuals: vi ? "Mood/setting" : "Mood/setting", engage: vi ? "Gợi ý chương sau" : "Next chapter prompts" };
  if (preset === "story-review") return { ...base, research: vi ? "Tóm tắt truyện" : "Story recap", strategy: vi ? "Góc review" : "Review angle", script: vi ? "Script review" : "Review script", visuals: vi ? "Cảnh review" : "Review visuals" };
  if (preset === "story-video") return { ...base, research: vi ? "Mạch truyện" : "Story arc", strategy: vi ? "Nhịp cảm xúc" : "Emotional pacing", script: vi ? "Narration" : "Narration", visuals: vi ? "Cảnh nền truyện" : "Story backgrounds" };
  if (preset === "algorithm-long") return { ...base, research: vi ? "Concept thuật toán" : "Algorithm concept", strategy: vi ? "Chapter plan" : "Chapter plan", script: vi ? "Script dài" : "Long script", visuals: vi ? "Ví dụ/chapter" : "Examples/chapters", metadata: vi ? "SEO video dài" : "Long-form SEO" };
  if (preset === "maze-pathfinding") return { ...base, research: vi ? "Mê cung & thuật toán" : "Maze algorithms", strategy: vi ? "Luật trận đua" : "Race rules", script: vi ? "Commentary" : "Commentary", visuals: vi ? "Maze visualizer" : "Maze visualizer", render: vi ? "Render đua mê cung" : "Render maze race" };
  if (preset === "algorithm-shorts") return { ...base, research: vi ? "Hook thuật toán" : "Algorithm hook", strategy: vi ? "Format Shorts" : "Shorts format", script: vi ? "Script ngắn" : "Short script", visuals: vi ? "Animation thuật toán" : "Algorithm animation" };
  return base;
}

function StageNode({ data }: NodeProps<Node<StageNodeData>>) {
  const running = data.status === "running";
  const condition = data.kind === "condition";
  const terminal = data.kind === "terminal";
  const dataNode = data.kind === "data";
  const skipped = data.status === "skipped";
  const done = data.status === "done";
  if (condition) {
    return (
      <div className="relative flex h-44 w-44 items-center justify-center">
        <NodeHandles />
        <div className={cn(
          "absolute inset-4 rotate-45 border-2 border-[var(--kai-agent-decision)] bg-[var(--kai-agent-decision-soft)] shadow-[0_0_18px_var(--kai-agent-decision-glow)] transition",
          skipped && "opacity-55 grayscale",
          data.selected && "ring-2 ring-primary/20",
          running && "shadow-[0_0_28px_var(--kai-agent-decision-glow)] ring-2 ring-[var(--kai-agent-decision)]/40"
        )} />
        <div className="relative z-10 px-8 text-center">
          <StatusIcon status={data.status} />
          <p className="mt-2 text-sm font-semibold leading-tight text-[var(--kai-agent-decision)]">{data.label}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{data.status}</p>
          {running ? <p className="mt-1 animate-pulse text-[11px] font-medium text-[var(--kai-agent-active)]">Live signal</p> : null}
        </div>
      </div>
    );
  }
  return (
    <div className={cn(
      "relative w-56 overflow-hidden border p-3 shadow-sm transition",
      terminal ? "rounded-full bg-[var(--kai-agent-terminal-bg)] text-center" : "rounded-xl bg-[var(--kai-agent-process-bg)]",
      dataNode && "border-[var(--kai-agent-data)] bg-[var(--kai-agent-data-soft)]",
      done && !running && "border-[var(--kai-agent-done)] bg-[var(--kai-agent-done-soft)]",
      skipped && "border-[var(--kai-agent-skip)] bg-[var(--kai-agent-skip-soft)] opacity-55 grayscale",
      data.selected && "border-primary ring-2 ring-primary/20",
      running && "border-[var(--kai-agent-active)] bg-[var(--kai-agent-active-soft)] shadow-[0_0_24px_var(--kai-agent-active-glow)] ring-2 ring-[var(--kai-agent-active)]/30"
    )}>
      {running ? <div className="absolute inset-x-0 top-0 h-1 animate-pulse bg-[var(--kai-agent-active)] shadow-[0_0_14px_var(--kai-agent-active)]" /> : null}
      <NodeHandles />
      <div className={cn("flex items-start gap-2", terminal && "justify-center")}>
        {!terminal ? <StatusIcon status={data.status} /> : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{data.label}</p>
          {!terminal ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{data.message || "Waiting"}</p> : null}
        </div>
      </div>
      {running && !terminal ? <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-[var(--kai-agent-active)]"><span className="h-2 w-2 animate-ping rounded-full bg-[var(--kai-agent-active)]" />Live signal</div> : null}
      {!terminal ? <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", data.status === "failed" ? "bg-destructive" : done ? "bg-[var(--kai-agent-done)]" : running ? "animate-pulse bg-[var(--kai-agent-active)] shadow-[0_0_10px_var(--kai-agent-active)]" : skipped ? "bg-[var(--kai-agent-skip)]" : "bg-muted-foreground")} style={{ width: `${Math.max(0, Math.min(100, data.progress || 0))}%` }} />
      </div> : null}
      {!terminal ? <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{data.status}</span>
        <span>{data.logCount} logs</span>
      </div> : null}
    </div>
  );
}

function NodeHandles() { return <>
  <Handle id="target-left" type="target" position={Position.Left} className="!left-[-10px] !h-3 !w-3 !border-0 !bg-transparent" /><Handle id="target-top" type="target" position={Position.Top} className="!top-[-10px] !h-3 !w-3 !border-0 !bg-transparent" /><Handle id="target-bottom" type="target" position={Position.Bottom} className="!bottom-[-10px] !h-3 !w-3 !border-0 !bg-transparent" />
  <Handle id="source-right" type="source" position={Position.Right} className="!right-[-10px] !h-3 !w-3 !border-0 !bg-transparent" /><Handle id="source-top" type="source" position={Position.Top} className="!top-[-10px] !h-3 !w-3 !border-0 !bg-transparent" /><Handle id="source-bottom" type="source" position={Position.Bottom} className="!bottom-[-10px] !h-3 !w-3 !border-0 !bg-transparent" />
</>; }

function StatusIcon({ status }: { status: string }) {
  if (status === "running") return <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-primary" />;
  if (status === "done") return <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />;
  if (status === "failed") return <XCircle className="mt-0.5 h-4 w-4 text-destructive" />;
  if (status === "skipped") return <Clock3 className="mt-0.5 h-4 w-4 text-muted-foreground" />;
  return <Circle className="mt-0.5 h-4 w-4 text-muted-foreground" />;
}

function fallbackSteps() { return ["Research", "Strategy", "Script", "Visual", "Voice", "Render", "Metadata", "Publish", "Engage", "Monetize"].map((label, index) => ({
    id: ["research", "strategy", "script", "visuals", "voice", "render", "metadata", "publish", "engage", "monetize"][index] as AgentWorkflowStageId,
    label,
    status: "pending",
    progress: 0,
    message: "",
  })); }
