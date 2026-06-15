import { useMemo, useState } from "react";
import { Background, Controls, Handle, MarkerType, Position, ReactFlow, type Edge, type Node, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CheckCircle2, Circle, Clock3, Loader2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { usePersistedFlowLayout } from "@/features/ai-video-agent/hooks/usePersistedFlowLayout";
import type { AgentVideoForm, AgentVideoJob, AgentWorkflowStageId } from "@/lib/aiVideoAgentApi";
import { text, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type FlowNodeKind = "stage" | "condition" | "branch" | "terminal" | "data" | "store" | "external";
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
  draftInput,
  lang,
  selectedStageId,
  onSelectStage,
}: {
  job?: AgentVideoJob;
  draftInput?: AgentVideoForm;
  lang: Lang;
  selectedStageId: AgentWorkflowStageId | "all";
  onSelectStage: (stageId: AgentWorkflowStageId | "all") => void;
}) {
  const [mode, setMode] = useState<FlowMode>("process");
  const steps = job?.steps?.length ? job.steps : fallbackSteps();
  const logs = job?.logs || [];
  const flowInput = job?.input || draftInput;
  const layoutKey = `${flowInput?.agentPreset || flowInput?.kind || "custom"}:${mode}`;
  const { dirty, positions, resetLayout, saveLayout, setNodePosition } = usePersistedFlowLayout(layoutKey);
  const flow = useMemo(() => buildAgentFlow(job, steps, lang, mode, draftInput), [job, steps, lang, mode, draftInput]);
  const nodes = useMemo<Node<StageNodeData>[]>(() => flow.nodes.map((node) => {
    const step = node.stageId ? steps.find((item) => item.id === node.stageId) : undefined;
    const status = node.status || step?.status || "pending";
    return {
      id: node.id,
      type: "stageNode",
      position: positions[node.id] || { x: node.x, y: node.y },
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
  }), [flow.nodes, positions, steps, selectedStageId, logs]);
  const edges = useMemo<Edge[]>(() => flow.edges.map((edge) => ({
    id: `${edge.source}-${edge.target}`,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle || "source-right",
    targetHandle: edge.targetHandle || "target-left",
    animated: edge.active,
    className: edge.active ? "kai-agent-running-edge" : edge.skipped ? "kai-agent-skipped-edge" : undefined,
    label: edge.label,
    labelBgPadding: [8, 5], labelBgBorderRadius: 6,
    labelBgStyle: { fill: "var(--kai-agent-label-bg)", fillOpacity: 0.96, stroke: "var(--kai-agent-label-border)", strokeWidth: 1 }, labelStyle: { fill: "var(--kai-agent-label-text)", fontSize: 12, fontWeight: 700 },
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
            <SegmentedTabs value={mode} options={[{ value: "process", label: text(lang, "Process flow", "Sơ đồ xử lý") }, { value: "data", label: text(lang, "Data flow", "Sơ đồ dữ liệu") }]} onValueChange={setMode} aria-label={text(lang, "Flow chart mode", "Chế độ sơ đồ")} className="h-9 bg-card/70" />
            {dirty ? <button type="button" className="rounded-full border border-primary bg-primary px-3 py-1 font-medium text-primary-foreground" onClick={saveLayout}>{text(lang, "Save layout", "Lưu layout")}</button> : null}
            <button type="button" className="rounded-full border px-3 py-1 font-medium hover:bg-muted" onClick={resetLayout}>{text(lang, "Reset layout", "Reset layout")}</button>
            <button type="button" className="underline-offset-4 hover:underline" onClick={() => onSelectStage("all")}>{text(lang, "All logs", "Tất cả log")}</button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="kai-agent-flow-shell h-[680px] overflow-hidden rounded-xl border bg-muted/20 xl:h-[720px]">
          <style>{`
            .kai-agent-flow-card {
              --kai-agent-active: #0284c7; --kai-agent-active-soft: rgba(2, 132, 199, 0.2);
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
              --kai-agent-label-bg: #ffffff; --kai-agent-label-border: rgba(15, 23, 42, 0.2); --kai-agent-label-text: #020617;
            }
            .dark .kai-agent-flow-card {
              --kai-agent-active: #fb923c; --kai-agent-active-soft: rgba(251, 146, 60, 0.18);
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
              --kai-agent-label-bg: #020617; --kai-agent-label-border: rgba(148, 163, 184, 0.55); --kai-agent-label-text: #f8fafc;
            }
            .kai-agent-running-edge .react-flow__edge-path { stroke-dasharray: 12 8; animation: kai-agent-flow-dash 0.7s linear infinite; filter: drop-shadow(0 0 7px var(--kai-agent-active-glow)); }
            .kai-agent-skipped-edge .react-flow__edge-path { stroke-dasharray: 4 8; filter: grayscale(1); }
            .kai-agent-skipped-edge .react-flow__edge-text, .kai-agent-skipped-edge .react-flow__edge-textbg { opacity: 0.55; }
            @keyframes kai-agent-flow-dash { from { stroke-dashoffset: 20; } to { stroke-dashoffset: 0; } }
          `}</style>
          <ReactFlow
            key={`${mode}-${job?.id || "empty"}-${job?.updatedAtMs || 0}-${runningStep?.id || "idle"}-${flowInput?.agentPreset || flowInput?.kind || "custom"}`}
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.14 }}
            minZoom={0.2}
            maxZoom={1.4}
            nodesDraggable
            nodesConnectable={false}
            edgesReconnectable={false}
            deleteKeyCode={null}
            elementsSelectable
            onNodeDragStop={(_event, node) => setNodePosition(node.id, node.position)}
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

function buildAgentFlow(job: AgentVideoJob | undefined, steps: AgentStep[], lang: Lang, mode: FlowMode, draftInput?: AgentVideoForm) {
  const input = job?.input || draftInput;
  if (mode === "data") return buildAgentDataFlow(job, steps, lang, draftInput);
  const vi = lang === "vi";
  const labels = getAgentLabels(input?.agentPreset || input?.kind || "custom", vi);
  const hasPlan = Boolean(job?.plan);
  const fallback = Boolean(job?.plan?.warning);
  const hasApiKeyPath = hasPlan && !fallback;
  const publishStep = steps.find((step) => step.id === "publish");
  const autoPublish = Boolean(input?.autoCreatePublishJobs);
  const runningId = steps.find((step) => step.status === "running")?.id;
  const node = (id: string, label: string, x: number, y: number, stageId?: AgentWorkflowStageId, extra?: Partial<FlowSpecNode>): FlowSpecNode => ({ id, label, x, y, stageId, ...extra });
  const nodes: FlowSpecNode[] = [
    node("start", vi ? "Bắt đầu" : "Start", -360, 240, undefined, { kind: "terminal", status: job ? "done" : "pending", progress: job ? 100 : 0 }),
    node("research", labels.research, 0, 220, "research"),
    node("api-check", vi ? "Có API key?" : "API key?", 360, 220, "research", { kind: "condition", status: conditionStatus(steps, "research"), progress: hasPlan ? 100 : 0, message: apiMessage(job, vi) }),
    node("ai-plan", vi ? "AI plan" : "AI plan", 760, 0, "research", { kind: "branch", status: branchStatus(hasApiKeyPath, fallback, runningId === "research"), progress: hasApiKeyPath ? 100 : 0, message: labels.aiPlan }),
    node("fallback-plan", vi ? "Fallback local" : "Local fallback", 760, 470, "research", { kind: "branch", status: branchStatus(fallback, hasApiKeyPath, runningId === "research"), progress: fallback ? 100 : 0, message: job?.plan?.warning || labels.fallback }),
    node("strategy", labels.strategy, 1140, 220, "strategy"),
    node("script", labels.script, 1500, 220, "script"),
    node("visuals", labels.visuals, 1860, 0, "visuals"),
    node("voice", labels.voice, 1860, 470, "voice"),
    node("render", labels.render, 2220, 220, "render"),
    node("metadata", labels.metadata, 2580, 100, "metadata"),
    node("publish-check", vi ? "Auto publish?" : "Auto publish?", 2940, 220, "publish", { kind: "condition", status: conditionStatus(steps, "metadata"), progress: publishStep?.progress || 0, message: autoPublish ? labels.publishYes : labels.publishNo }),
    node("publish", labels.publish, 3300, 0, "publish"),
    node("local-output", vi ? "Lưu local" : "Local output", 3300, 470, "publish", { kind: "branch", status: publishStep?.status === "skipped" ? "done" : autoPublish ? "skipped" : publishStep?.status || "pending", progress: publishStep?.status === "skipped" ? 100 : 0, message: labels.publishNo }),
    node("engage", labels.engage, 3660, 100, "engage"),
    node("monetize", labels.monetize, 4020, 320, "monetize"),
    node("end", vi ? "Kết thúc" : "End", 4380, 320, undefined, { kind: "terminal", status: job?.status === "success" ? "done" : job?.status === "failed" ? "failed" : "pending", progress: job?.status === "success" ? 100 : 0, message: job?.status === "failed" ? job.error : "" }),
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

function buildAgentDataFlow(job: AgentVideoJob | undefined, steps: AgentStep[], lang: Lang, draftInput?: AgentVideoForm) {
  const vi = lang === "vi", runningId = steps.find((step) => step.status === "running")?.id;
  const fallback = Boolean(job?.plan?.warning), autoPublish = Boolean((job?.input || draftInput)?.autoCreatePublishJobs), hasApiKeyPath = Boolean(job?.plan && !fallback);
  const labels = getAgentLabels(job?.input?.agentPreset || draftInput?.agentPreset || draftInput?.kind || "custom", vi);
  const n = (id: string, label: string, x: number, y: number, stageId?: AgentWorkflowStageId, extra?: Partial<FlowSpecNode>): FlowSpecNode => ({ id, label, x, y, stageId, kind: "data", ...extra });
  const active = (source: AgentWorkflowStageId, target?: AgentWorkflowStageId) => runningId === source || runningId === target;
  return {
    nodes: [
      n("user-input", vi ? "Người dùng / Form agent" : "User / Agent form", -420, 230, "research", { kind: "external", status: job ? "done" : "pending", message: vi ? "Nguồn topic, setting, kênh đăng." : "Source of topic, settings, selected channels." }),
      n("runtime-config", vi ? "Kho cấu hình local" : "Local config store", -60, 20, "research", { kind: "store", status: job ? "done" : "pending", message: vi ? "API key, preset, token, fallback." : "API keys, presets, tokens, fallback data." }),
      n("plan-resolver", vi ? "Resolve plan" : "Resolve plan", 260, 230, "research", { message: fallback ? (vi ? "Thiếu API key, đọc fallback local." : "No API key, reading local fallback.") : vi ? "Chuẩn hóa input thành plan." : "Normalizes input into a plan." }),
      n("ai-provider", vi ? "AI provider" : "AI provider", 620, 20, "research", { kind: "external", status: hasApiKeyPath ? "done" : fallback ? "skipped" : "pending", message: vi ? "Nhận prompt, trả plan." : "Receives prompt, returns plan." }),
      n("fallback-store", vi ? "Fallback templates" : "Fallback templates", 620, 430, "research", { kind: "store", status: fallback ? "done" : hasApiKeyPath ? "skipped" : "pending", message: vi ? "Dữ liệu local của agent." : "Local agent data." }),
      n("plan-store", vi ? "Plan JSON" : "Plan JSON", 980, 230, "strategy", { kind: "store" }),
      n("script-process", labels.script, 1340, 110, "script"),
      n("asset-process", labels.visuals, 1340, 350, "visuals"),
      n("script-store", vi ? "Script + scene cues" : "Script + scene cues", 1700, 110, "script", { kind: "store" }),
      n("asset-store", vi ? "Visual assets" : "Visual assets", 1700, 350, "visuals", { kind: "store" }),
      n("voice-process", vi ? "Sinh voice" : "Voice process", 2060, 110, "voice"),
      n("audio-store", vi ? "Audio file" : "Audio file", 2420, 110, "voice", { kind: "store" }),
      n("render-process", vi ? "Render video" : "Render process", 2420, 350, "render"),
      n("video-store", vi ? "MP4 output" : "MP4 output", 2780, 350, "render", { kind: "store" }),
      n("metadata-store", vi ? "Metadata + thumbnail" : "Metadata + thumbnail", 3140, 210, "metadata", { kind: "store" }),
      n("publish-sink", vi ? "Queue / Nền tảng" : "Queue / Platforms", 3500, 210, "publish", { kind: "external", status: autoPublish ? "done" : "skipped", message: autoPublish ? (vi ? "Nhận payload đăng kênh." : "Receives upload payload.") : (vi ? "Tắt auto publish." : "Auto publish disabled.") }),
    ],
    edges: [
      { source: "user-input", target: "plan-resolver", active: runningId === "research", label: "topic + settings" },
      { source: "runtime-config", target: "plan-resolver", active: runningId === "research", label: "keys + preset", sourceHandle: "source-bottom", targetHandle: "target-top" },
      { source: "plan-resolver", target: "ai-provider", active: runningId === "research" && hasApiKeyPath, skipped: fallback, label: "prompt", sourceHandle: "source-top", targetHandle: "target-left" },
      { source: "ai-provider", target: "plan-store", active: hasApiKeyPath && active("research", "strategy"), skipped: fallback, label: "AI plan JSON", sourceHandle: "source-right", targetHandle: "target-top" },
      { source: "fallback-store", target: "plan-store", active: fallback && active("research", "strategy"), skipped: hasApiKeyPath, label: "local plan JSON", sourceHandle: "source-right", targetHandle: "target-bottom" },
      { source: "plan-store", target: "script-process", active: active("strategy", "script"), label: "outline + scenes", targetHandle: "target-bottom" }, { source: "plan-store", target: "asset-process", active: active("strategy", "visuals"), label: "visual spec", targetHandle: "target-left" },
      { source: "script-process", target: "script-store", active: active("script"), label: "script text" }, { source: "asset-process", target: "asset-store", active: active("visuals"), label: "image/video refs" },
      { source: "script-store", target: "voice-process", active: active("script", "voice"), label: "narration text" }, { source: "voice-process", target: "audio-store", active: active("voice"), label: "wav/mp3" },
      { source: "audio-store", target: "render-process", active: active("voice", "render"), label: "audio", sourceHandle: "source-bottom", targetHandle: "target-top" }, { source: "asset-store", target: "render-process", active: active("visuals", "render"), label: "assets" },
      { source: "render-process", target: "video-store", active: active("render"), label: "mp4" }, { source: "video-store", target: "metadata-store", active: active("render", "metadata"), label: "video ref" },
      { source: "script-store", target: "metadata-store", active: active("script", "metadata"), label: "title/tags seed", sourceHandle: "source-top", targetHandle: "target-left" }, { source: "metadata-store", target: "publish-sink", active: autoPublish && active("metadata", "publish"), skipped: !autoPublish, label: "upload payload" },
    ] as FlowSpecEdge[],
  };
}

function conditionStatus(steps: AgentStep[], waitFor: AgentWorkflowStageId) {
  const step = steps.find((item) => item.id === waitFor);
  return step?.status === "running" ? "running" : step?.status === "done" || step?.status === "skipped" ? "done" : step?.status === "failed" ? "failed" : "pending";
}

function branchStatus(activeBranch: boolean, skippedBranch: boolean, parentRunning: boolean) {
  return activeBranch ? "done" : skippedBranch ? "skipped" : parentRunning ? "pending" : "pending";
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
  const condition = data.kind === "condition", terminal = data.kind === "terminal", dataNode = data.kind === "data";
  const store = data.kind === "store", external = data.kind === "external";
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
      store && "rounded-md border-[var(--kai-agent-data)] bg-[var(--kai-agent-data-soft)] shadow-[inset_8px_0_0_var(--kai-agent-data)]",
      external && "border-dashed border-[var(--kai-agent-data)] bg-[var(--kai-agent-data-soft)]",
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
  <Handle id="target-left" type="target" position={Position.Left} className="!h-2 !w-2" /><Handle id="target-top" type="target" position={Position.Top} className="!h-2 !w-2" /><Handle id="target-bottom" type="target" position={Position.Bottom} className="!h-2 !w-2" />
  <Handle id="source-right" type="source" position={Position.Right} className="!h-2 !w-2" /><Handle id="source-top" type="source" position={Position.Top} className="!h-2 !w-2" /><Handle id="source-bottom" type="source" position={Position.Bottom} className="!h-2 !w-2" />
</>; }

function StatusIcon({ status }: { status: string }) {
  if (status === "running") return <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-primary" />;
  if (status === "done") return <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />;
  if (status === "failed") return <XCircle className="mt-0.5 h-4 w-4 text-destructive" />;
  if (status === "skipped") return <Clock3 className="mt-0.5 h-4 w-4 text-muted-foreground" />;
  return <Circle className="mt-0.5 h-4 w-4 text-muted-foreground" />;
}

function fallbackSteps() { const ids = ["research", "strategy", "script", "visuals", "voice", "render", "metadata", "publish", "engage", "monetize"] as AgentWorkflowStageId[];
  return ["Research", "Strategy", "Script", "Visual", "Voice", "Render", "Metadata", "Publish", "Engage", "Monetize"].map((label, index) => ({ id: ids[index], label, status: "pending", progress: 0, message: "" }));
}
