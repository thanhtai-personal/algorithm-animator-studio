import { GripVertical } from "lucide-react";
import {
  RHYTHMIC_PANEL_LAYOUT_LIMITS,
  type RhythmicPanelSide,
} from "./rhythmicPanelLayout";

interface Props {
  side: RhythmicPanelSide;
  width: number;
  active: boolean;
  label: string;
  onBeginResize: (side: RhythmicPanelSide, clientX: number) => void;
  onResizeByPointerDelta: (side: RhythmicPanelSide, deltaX: number) => void;
}

const KEYBOARD_STEP = 16;

export function RhythmicPanelResizeHandle(props: Props) {
  const limits = RHYTHMIC_PANEL_LAYOUT_LIMITS[props.side];

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    props.onResizeByPointerDelta(props.side, event.key === "ArrowRight" ? KEYBOARD_STEP : -KEYBOARD_STEP);
  };

  return (
    <div
      role="separator"
      aria-label={props.label}
      aria-orientation="vertical"
      aria-valuemin={limits.min}
      aria-valuemax={limits.max}
      aria-valuenow={props.width}
      className="rhythmic-panel-resizer"
      data-active={props.active || undefined}
      data-side={props.side}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        props.onBeginResize(props.side, event.clientX);
      }}
    >
      <span className="rhythmic-panel-resizer-grip" aria-hidden="true"><GripVertical /></span>
    </div>
  );
}
