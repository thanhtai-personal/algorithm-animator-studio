
export type AISettingsUpdate = Partial<{
  ai_requests_remaining: number;
  ignore_voice_verify: boolean;
  ai_trial_used: boolean;
}>;