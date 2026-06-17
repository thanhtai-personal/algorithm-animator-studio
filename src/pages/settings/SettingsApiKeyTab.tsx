import { useState } from "react";
import { Bot, ChevronsLeft, ChevronsRight, KeyRound, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { t, type Lang  } from "@/lib/i18n";
import { SecretInput } from "./SettingsFields";
import type { SettingsForm, SettingsFormKey } from "./SettingsTypes";

type SettingsApiKeyTabProps = {
  form: SettingsForm;
  lang: Lang;
  onUpdateField: (key: SettingsFormKey, value: string) => void;
};

type ApiSection = "agent" | "elevenlabs";

const API_SECTIONS: { id: ApiSection; label: string; icon: typeof KeyRound }[] = [
  { id: "agent", label: "AI Agent Flow", icon: Bot },
  { id: "elevenlabs", label: "ElevenLabs", icon: Waves },
];

export function SettingsApiKeyTab(props: SettingsApiKeyTabProps) {
  const [activeSection, setActiveSection] = useState<ApiSection>("agent");
  const [menuCollapsed, setMenuCollapsed] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(props.lang, "settingsApiKeyTab")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)]">
          <aside className={`rounded-lg border border-border bg-muted/30 p-2 transition-[width] duration-200 ${menuCollapsed ? "w-[68px]" : "w-full lg:w-56"}`}>
            <div className="mb-2 flex items-center justify-between gap-2">
              {!menuCollapsed ? <span className="px-2 text-xs font-semibold text-muted-foreground">{t(props.lang, "settingsApiKeyTab")}</span> : null}
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setMenuCollapsed((value) => !value)}>
                {menuCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
              </Button>
            </div>
            <nav className="grid gap-1" aria-label={t(props.lang, "settingsApiKeyTab")}>
              {API_SECTIONS.map((section) => {
                const Icon = section.icon;
                const selected = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    className={[
                      "flex h-10 items-center gap-2 rounded-md px-2 text-sm font-medium transition-colors",
                      selected ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                      menuCollapsed ? "justify-center" : "justify-start",
                    ].join(" ")}
                    title={section.label}
                    aria-current={selected ? "page" : undefined}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {menuCollapsed ? <span className="sr-only">{section.label}</span> : <span>{section.label}</span>}
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="min-w-0">
            {activeSection === "agent" ? <AgentApiFields {...props} /> : null}
            {activeSection === "elevenlabs" ? <ElevenLabsApiFields {...props} /> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AgentApiFields(props: SettingsApiKeyTabProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>{t(props.lang, "uiAgentTextProvider")}</Label>
        <Select value={props.form.AI_AGENT_PROVIDER || "gemini"} onValueChange={(value) => props.onUpdateField("AI_AGENT_PROVIDER", value)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="gemini">Gemini</SelectItem>
            <SelectItem value="openai">OpenAI / OpenAI-compatible</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <SecretInput
        id="ai-shorts-api-key"
        label={t(props.lang, "uiGeminiApiKey")}
        description=""
        value={props.form.AI_SHORTS_API_KEY}
        placeholder="AIza..."
        onChange={(value) => props.onUpdateField("AI_SHORTS_API_KEY", value)}
      />
      <TextInput id="ai-agent-text-model" label={t(props.lang, "uiGeminiTextModel")} value={props.form.AI_AGENT_TEXT_MODEL} placeholder="gemini-2.0-flash" onChange={(value) => props.onUpdateField("AI_AGENT_TEXT_MODEL", value)} />
      <TextInput id="ai-shorts-api-url" label={t(props.lang, "uiGeminiApiBaseUrl")} value={props.form.AI_SHORTS_API_URL} placeholder="https://generativelanguage.googleapis.com/v1beta" onChange={(value) => props.onUpdateField("AI_SHORTS_API_URL", value)} />
      <SecretInput
        id="openai-api-key"
        label={t(props.lang, "uiOpenaiCompatibleApiKey")}
        description=""
        value={props.form.OPENAI_API_KEY}
        placeholder="sk-..."
        onChange={(value) => props.onUpdateField("OPENAI_API_KEY", value)}
      />
      <div className="grid gap-3 md:grid-cols-2">
        <TextInput id="openai-base-url" label="OPENAI_BASE_URL" value={props.form.OPENAI_BASE_URL} placeholder="https://api.openai.com/v1" onChange={(value) => props.onUpdateField("OPENAI_BASE_URL", value)} />
        <TextInput id="openai-chat-model" label="OPENAI_CHAT_MODEL" value={props.form.OPENAI_CHAT_MODEL} placeholder="gpt-4o-mini" onChange={(value) => props.onUpdateField("OPENAI_CHAT_MODEL", value)} />
      </div>
    </div>
  );
}

function ElevenLabsApiFields(props: SettingsApiKeyTabProps) {
  return (
    <SecretInput
      id="elevenlabs-api-key"
      label={t(props.lang, "settingsElevenLabsApiKeyLabel")}
      description=""
      value={props.form.ELEVENLABS_API_KEY}
      placeholder="sk_..."
      onChange={(value) => props.onUpdateField("ELEVENLABS_API_KEY", value)}
    />
  );
}

function TextInput(props: { id: string; label: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id}>{props.label}</Label>
      <Input id={props.id} value={props.value} placeholder={props.placeholder} onChange={(event) => props.onChange(event.target.value)} />
    </div>
  );
}
