import { algorithmExplainerPreset } from "./presets/algorithmExplainerPreset";
import { designerAiWorkflowPreset } from "./presets/designer-ai-workflow/designerAiPreset";
import { designerNgayNayPreset } from "./presets/designer-ngay-nay/designerNgayNayPreset";
import { fivePrayersPreset } from "./presets/five-prayers/fivePrayersPreset";
import { fashionClawPreset } from "./presets/fashion-claw/fashionClawPreset";
import { gptsMcpControlPlanePreset } from "./presets/gpts-mcp-promo/gatewayControlPlanePreset";
import { gptsMcpMobileWorkflowPreset } from "./presets/gpts-mcp-promo/mobileWorkflowPreset";
import { gptsMcpSecureGatewayPreset } from "./presets/gpts-mcp-promo/secureGatewayPreset";
import { gptsMcpTokenFallbackPreset } from "./presets/gpts-mcp-promo/tokenFallbackPreset";
import { numberEightInRedPreset } from "./presets/number-eight-in-red/numberEightInRedPreset";
import type { PresetVideoDefinition } from "./types";

/**
 * Source-controlled registry for code-generated video presets.
 *
 * AI patches add a preset component + metadata, then register it in this array.
 * The library, preview and Remotion renderer discover it automatically.
 */
export const PRESET_VIDEO_REGISTRY: readonly PresetVideoDefinition[] = [
  algorithmExplainerPreset,
  fashionClawPreset,
  numberEightInRedPreset,
  fivePrayersPreset,
  designerNgayNayPreset,
  designerAiWorkflowPreset,
  gptsMcpControlPlanePreset,
  gptsMcpTokenFallbackPreset,
  gptsMcpMobileWorkflowPreset,
  gptsMcpSecureGatewayPreset,
];

export function getPresetVideoDefinition(presetId: string) {
  return PRESET_VIDEO_REGISTRY.find((preset) => preset.id === presetId);
}
