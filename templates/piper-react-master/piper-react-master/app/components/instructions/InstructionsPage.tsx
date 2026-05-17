import { Link } from "react-router";
import { useState } from "react";
import { PageHeader, SectionCard, StatusBadge } from "../AppHeader";
import { useI18n } from "../../i18n";

type InstructionTabId = "elevenlabs" | "aiShorts";

type InstructionStep = {
  title: string;
  body: string;
};

const instructionTabs: Array<{ id: InstructionTabId; labelKey: "instructionsElevenLabsTab" | "instructionsAiShortsTab" }> = [
  { id: "elevenlabs", labelKey: "instructionsElevenLabsTab" },
  { id: "aiShorts", labelKey: "instructionsAiShortsTab" },
];

export function InstructionsPage() {
  const { language, t } = useI18n();
  const [activeTab, setActiveTab] = useState<InstructionTabId>("elevenlabs");
  const isVietnamese = language === "vi";
  const steps = activeTab === "elevenlabs" ? getElevenLabsSteps(isVietnamese) : getAiShortsSteps(isVietnamese);
  const settingsTarget = activeTab === "elevenlabs" ? "/settings?tab=elevenlabs" : "/settings?tab=aiShorts";

  return (
    <>
      <PageHeader
        title={t("instructionsTitle")}
        description={t("instructionsDescription")}
        badge={<StatusBadge>{activeTab === "elevenlabs" ? t("instructionsElevenLabsBadge") : t("instructionsAiShortsBadge")}</StatusBadge>}
        actions={
          <Link className="button" to={settingsTarget}>
            {t("instructionsOpenSettings")}
          </Link>
        }
      />

      <div className="settingsTabs">
        <div className="settingsTabList" role="tablist" aria-label={t("instructionsTabsLabel")}>
          {instructionTabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`settingsTab ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{t(tab.labelKey)}</span>
                <small>{tab.id === "elevenlabs" ? "ELEVENLABS_API_KEY" : "AI_SHORTS_API_KEY"}</small>
              </button>
            );
          })}
        </div>

        <section className="surface-card p-5 md:p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-display font-semibold">
                {activeTab === "elevenlabs" ? t("instructionsElevenLabsTitle") : t("instructionsAiShortsTitle")}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                {activeTab === "elevenlabs" ? t("instructionsElevenLabsDescription") : t("instructionsAiShortsDescription")}
              </p>
            </div>
            <Link className="btn-ghost" to={settingsTarget}>
              {t("instructionsFillSettings")}
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {steps.map((step, index) => (
              <SectionCard key={step.title} step={String(index + 1)} title={step.title} description={step.body}>
                {index === steps.length - 1 ? (
                  <div className="rounded-2xl border border-border bg-card/50 p-4 text-sm text-muted-foreground leading-6">
                    {t("instructionsSecurityNote")}
                  </div>
                ) : null}
              </SectionCard>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function getElevenLabsSteps(isVietnamese: boolean): InstructionStep[] {
  if (isVietnamese) {
    return [
      {
        title: "Đăng nhập ElevenLabs",
        body: "Vào dashboard ElevenLabs bằng tài khoản bạn muốn dùng để tạo giọng PRO. Nên dùng tài khoản riêng cho dự án để dễ quản lý chi phí.",
      },
      {
        title: "Mở phần API Keys",
        body: "Tìm khu vực Developers hoặc Workspace settings, sau đó mở trang API Keys để tạo key mới cho ứng dụng.",
      },
      {
        title: "Tạo key có giới hạn phù hợp",
        body: "Tạo API key mới, đặt tên dễ nhận biết, giới hạn quyền Text to Speech nếu có thể và đặt quota để tránh phát sinh chi phí ngoài ý muốn.",
      },
      {
        title: "Dán key vào Kata Studio",
        body: "Mở Cài đặt → ElevenLabs, dán key vào ELEVENLABS_API_KEY và thêm danh sách voice bằng bảng Voice ID / Tên giọng.",
      },
    ];
  }

  return [
    {
      title: "Sign in to ElevenLabs",
      body: "Open the ElevenLabs dashboard with the account you want to use for PRO narration. A project-specific account makes usage easier to track.",
    },
    {
      title: "Open API Keys",
      body: "Find Developers or Workspace settings, then open API Keys to create a new key for this app.",
    },
    {
      title: "Create a restricted key",
      body: "Create a new API key, give it a clear name, restrict it to Text to Speech when possible, and set a quota to control spend.",
    },
    {
      title: "Paste it into Kata Studio",
      body: "Open Settings → ElevenLabs, paste the key into ELEVENLABS_API_KEY, then add voices with the Voice ID / Voice label table.",
    },
  ];
}

function getAiShortsSteps(isVietnamese: boolean): InstructionStep[] {
  if (isVietnamese) {
    return [
      {
        title: "Mở Google AI Studio",
        body: "Kata Studio dùng Gemini API với model Veo 3.1 Fast để tạo video Shorts 9:16. Vào Google AI Studio bằng tài khoản bạn muốn dùng để quản lý chi phí.",
      },
      {
        title: "Tạo Gemini API key",
        body: "Vào Get API key, tạo key mới cho project hiện tại. Nên dùng key riêng cho Kata Studio để dễ thu hồi hoặc giới hạn quota khi cần.",
      },
      {
        title: "Nhập vào tab Gemini Veo",
        body: "Mở Cài đặt → Gemini Veo, dán key vào AI_SHORTS_API_KEY. Giữ model mặc định veo-3.1-fast-generate-preview và API URL mặc định của Google.",
      },
      {
        title: "Quay lại màn hình Tạo Shorts",
        body: "Sau khi lưu settings, lớp khóa API sẽ biến mất. App sẽ gọi Gemini Veo trực tiếp, poll job hoàn tất, tải MP4 về máy rồi cho xem trước/chỉnh sửa.",
      },
    ];
  }

  return [
    {
      title: "Open Google AI Studio",
      body: "Kata Studio uses the Gemini API with the Veo 3.1 Fast model to generate 9:16 Shorts videos. Sign in with the Google account you want to use for billing and quota.",
    },
    {
      title: "Create a Gemini API key",
      body: "Open Get API key and create a new key for your current project. Use a dedicated key for Kata Studio so it can be revoked or quota-limited later.",
    },
    {
      title: "Fill the Gemini Veo tab",
      body: "Open Settings → Gemini Veo, paste the key into AI_SHORTS_API_KEY, and keep the default veo-3.1-fast-generate-preview model and Google API base URL.",
    },
    {
      title: "Return to AI Shorts",
      body: "After saving settings, the lock overlay disappears. The app calls Gemini Veo, polls the job until it finishes, downloads the MP4 locally, and lets you preview/edit it.",
    },
  ];
}
