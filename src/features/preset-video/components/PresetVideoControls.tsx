import { Component, useEffect, useRef, type ErrorInfo, type ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export function TrimSlider(props: {
  label: string;
  value: number;
  min?: number;
  max: number;
  duration: number;
  onChange: (value: number) => void;
}) {
  const min = props.min ?? 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <Label>{props.label}</Label>
        <span className="font-mono text-xs text-muted-foreground">{formatPresetSeconds(props.value)}</span>
      </div>
      <Slider
        value={[Math.min(props.max, Math.max(min, props.value))]}
        min={min}
        max={Math.max(min, props.max)}
        step={0.1}
        onValueChange={([value]) => props.onChange(value)}
      />
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>00:00.0</span>
        <span>{formatPresetSeconds(props.duration)}</span>
      </div>
    </div>
  );
}

export function VolumeSlider(props: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <Label>{props.label}</Label>
        <span>{Math.round(props.value * 100)}%</span>
      </div>
      <Slider
        value={[props.value]}
        min={0}
        max={1}
        step={0.01}
        onValueChange={([value]) => props.onChange(value)}
      />
    </div>
  );
}

export function MusicPreview({ src, volume }: { src: string; volume: number }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.volume = volume;
  }, [volume]);
  return <audio ref={ref} controls preload="metadata" src={src} className="h-9 w-full" />;
}

export function formatPresetSeconds(value: number) {
  const safe = Math.max(0, Number.isFinite(value) ? value : 0);
  const minutes = Math.floor(safe / 60);
  const seconds = safe - minutes * 60;
  return `${String(minutes).padStart(2, "0")}:${seconds.toFixed(1).padStart(4, "0")}`;
}

export class PresetPreviewErrorBoundary extends Component<{ children: ReactNode }, { error: string }> {
  state = { error: "" };

  static getDerivedStateFromError(error: Error) {
    return { error: error.message || "Preset preview bị lỗi." };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Preset video preview failed", error, info);
  }

  render() {
    if (this.state.error) {
      return <div className="grid min-h-72 place-items-center p-8 text-center text-sm text-red-300">{this.state.error}</div>;
    }
    return this.props.children;
  }
}
