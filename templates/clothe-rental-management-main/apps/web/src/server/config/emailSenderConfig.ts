import { enabledEmailSender, parseBooleanFlag } from "@/lib/config/emailSender";

export function isEmailSenderEnabled(): boolean {
  const privateFlag = parseBooleanFlag(process.env.ENABLED_EMAIL_SENDER);
  if (privateFlag !== undefined) return privateFlag;
  return enabledEmailSender;
}
