import { Link } from "react-router";
import { PageHeader, SectionCard, StatusBadge } from "../AppHeader";
import { useI18n } from "../../i18n";
import {
  APP_AUTHORIZED_DOMAIN,
  APP_DISPLAY_NAME,
  APP_HOME_URL,
  APP_LEGAL_UPDATED_AT,
  APP_PRIVACY_URL,
  APP_TERMS_URL,
} from "../../constants/legal";

type LegalCopy = {
  pageTitle: string;
  pageDescription: string;
  badge: string;
  updated: string;
  sections: Array<{
    title: string;
    body: Array<string>;
  }>;
};

export function PrivacyPolicyPage() {
  const { language } = useI18n();
  const copy = language === "vi" ? getPrivacyVi() : getPrivacyEn();

  return <LegalDocument copy={copy} activeLink="privacy" />;
}

export function TermsOfServicePage() {
  const { language } = useI18n();
  const copy = language === "vi" ? getTermsVi() : getTermsEn();

  return <LegalDocument copy={copy} activeLink="terms" />;
}

function LegalDocument({ copy, activeLink }: { copy: LegalCopy; activeLink: "privacy" | "terms" }) {
  return (
    <div className="legalDocumentPage mx-auto max-w-5xl space-y-5">
      <PageHeader
        title={copy.pageTitle}
        description={copy.pageDescription}
        badge={<StatusBadge>{copy.badge}</StatusBadge>}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link className={activeLink === "privacy" ? "button" : "btn-ghost"} to="/privacy">
              Privacy
            </Link>
            <Link className={activeLink === "terms" ? "button" : "btn-ghost"} to="/term">
              Terms
            </Link>
          </div>
        }
      />

      <section className="surface-card p-5 md:p-6 space-y-4 text-sm leading-7 text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/60 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Application</p>
            <p className="mt-1 text-base font-semibold text-foreground">{APP_DISPLAY_NAME}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last updated</p>
            <p className="mt-1 text-base font-semibold text-foreground">{copy.updated}</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <LegalLinkCard label="Home page" value={APP_HOME_URL} />
          <LegalLinkCard label="Privacy policy" value={APP_PRIVACY_URL} />
          <LegalLinkCard label="Terms of service" value={APP_TERMS_URL} />
        </div>
      </section>

      <div className="grid gap-4">
        {copy.sections.map((section, index) => (
          <SectionCard key={section.title} step={String(index + 1)} title={section.title}>
            <div className="space-y-3 text-sm leading-7 text-muted-foreground">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}

function LegalLinkCard({ label, value }: { label: string; value: string }) {
  return (
    <a
      className="rounded-2xl border border-border bg-background/50 p-4 text-sm transition-colors hover:bg-accent/60"
      href={value}
      target="_blank"
      rel="noreferrer"
    >
      <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="mt-2 block break-all font-medium text-foreground">{value}</span>
    </a>
  );
}

function getPrivacyVi(): LegalCopy {
  return {
    pageTitle: "Chính sách quyền riêng tư",
    pageDescription: `${APP_DISPLAY_NAME} tôn trọng dữ liệu cá nhân và chỉ sử dụng dữ liệu cần thiết để tạo giọng đọc, tạo video và kết nối YouTube theo lựa chọn của người dùng.`,
    badge: "Privacy Policy",
    updated: APP_LEGAL_UPDATED_AT,
    sections: [
      {
        title: "Dữ liệu ứng dụng xử lý",
        body: [
          `${APP_DISPLAY_NAME} có thể xử lý nội dung người dùng nhập vào, tệp audio, tệp video, hình nền, nhạc nền, metadata video YouTube, cài đặt giao diện và cài đặt công cụ local.`,
          "Ở bản public web, dữ liệu resource có thể được lưu trong bộ nhớ trình duyệt hoặc IndexedDB trên thiết bị của người dùng. Ở bản desktop/local, dữ liệu có thể được lưu trong thư mục dữ liệu local mà người dùng đã chọn trong phần cài đặt.",
        ],
      },
      {
        title: "Kết nối Google và YouTube",
        body: [
          "Khi người dùng chọn kết nối YouTube, ứng dụng sẽ chuyển người dùng đến màn hình cấp quyền của Google. Ứng dụng chỉ sử dụng quyền YouTube mà người dùng đồng ý để chuẩn bị hoặc đăng video theo thao tác của người dùng.",
          "Token cấp quyền có thể được lưu trong trình duyệt hoặc môi trường local của thiết bị để người dùng không phải đăng nhập lại liên tục. Người dùng có thể ngắt kết nối YouTube trong ứng dụng hoặc thu hồi quyền trong tài khoản Google bất kỳ lúc nào.",
        ],
      },
      {
        title: "Dữ liệu local và công cụ trên thiết bị",
        body: [
          "Một số tính năng như Piper local, FFmpeg local, Browser Recorder hoặc lưu resource có thể chạy trực tiếp trên thiết bị. Khi chạy local, tệp tạo ra được lưu trên thiết bị của người dùng và không tự động đồng bộ lên cloud.",
          "Nếu người dùng không cấp local access hoặc công cụ local chưa sẵn sàng, ứng dụng sẽ tắt lựa chọn tương ứng và cho phép dùng các công cụ khác còn khả dụng.",
        ],
      },
      {
        title: "Dịch vụ bên thứ ba",
        body: [
          "Ứng dụng có thể kết nối đến Google/YouTube, ElevenLabs hoặc các dịch vụ AI khác khi người dùng cấu hình API key hoặc thực hiện thao tác yêu cầu dịch vụ đó. Khi sử dụng dịch vụ bên thứ ba, dữ liệu gửi đi sẽ chịu thêm chính sách của nhà cung cấp dịch vụ tương ứng.",
          "Ứng dụng không bán dữ liệu cá nhân của người dùng cho nhà quảng cáo.",
        ],
      },
      {
        title: "Bảo mật và quyền kiểm soát của người dùng",
        body: [
          "Người dùng nên giữ kín API key, OAuth client secret và các thông tin cấu hình nhạy cảm. Không nên chia sẻ ảnh chụp màn hình có chứa khóa bí mật.",
          "Người dùng có thể xóa dữ liệu trong trình duyệt, xóa resource local, ngắt kết nối YouTube hoặc thu hồi quyền ứng dụng trong Google Account nếu không muốn tiếp tục sử dụng.",
        ],
      },
      {
        title: "Thông tin Google OAuth",
        body: [
          `Home page: ${APP_HOME_URL}`,
          `Privacy policy: ${APP_PRIVACY_URL}`,
          `Terms of service: ${APP_TERMS_URL}`,
          `Authorized domain: ${APP_AUTHORIZED_DOMAIN}`,
        ],
      },
    ],
  };
}

function getPrivacyEn(): LegalCopy {
  return {
    pageTitle: "Privacy Policy",
    pageDescription: `${APP_DISPLAY_NAME} respects user privacy and only uses data needed to create narration, generate videos, and connect YouTube when the user chooses to do so.`,
    badge: "Privacy Policy",
    updated: APP_LEGAL_UPDATED_AT,
    sections: [
      {
        title: "Data processed by the app",
        body: [
          `${APP_DISPLAY_NAME} may process text entered by the user, audio files, video files, background images, background music, YouTube video metadata, UI settings, and local tool settings.`,
          "In the public web version, resource data may be stored in browser storage or IndexedDB on the user's device. In the desktop/local version, generated files may be stored in the local data directory selected by the user.",
        ],
      },
      {
        title: "Google and YouTube connection",
        body: [
          "When the user connects YouTube, the app redirects the user to Google's consent screen. The app only uses the YouTube permissions granted by the user to prepare or upload videos as requested by the user.",
          "Authorization tokens may be stored in the browser or local device environment so the user does not need to sign in repeatedly. The user can disconnect YouTube in the app or revoke access from their Google Account at any time.",
        ],
      },
      {
        title: "Local device tools",
        body: [
          "Some features such as local Piper, local FFmpeg, Browser Recorder, and resource storage may run directly on the user's device. Local files stay on the user's device and are not automatically synced to a cloud server.",
          "If local access is not granted or a local tool is not ready, the app disables that specific option and allows the user to choose another available tool.",
        ],
      },
      {
        title: "Third-party services",
        body: [
          "The app may connect to Google/YouTube, ElevenLabs, or other AI services when the user configures an API key or performs an action that requires that service. Data sent to a third-party service is also subject to that provider's policy.",
          "The app does not sell user personal data to advertisers.",
        ],
      },
      {
        title: "Security and user control",
        body: [
          "Users should keep API keys, OAuth client secrets, and sensitive configuration private. Do not share screenshots that expose secret keys.",
          "Users can clear browser data, delete local resources, disconnect YouTube, or revoke app access from their Google Account if they no longer want to use the app.",
        ],
      },
      {
        title: "Google OAuth information",
        body: [
          `Home page: ${APP_HOME_URL}`,
          `Privacy policy: ${APP_PRIVACY_URL}`,
          `Terms of service: ${APP_TERMS_URL}`,
          `Authorized domain: ${APP_AUTHORIZED_DOMAIN}`,
        ],
      },
    ],
  };
}

function getTermsVi(): LegalCopy {
  return {
    pageTitle: "Điều khoản sử dụng",
    pageDescription: `Các điều khoản cơ bản khi sử dụng ${APP_DISPLAY_NAME} để tạo giọng đọc, tạo video, quản lý resource và kết nối YouTube.`,
    badge: "Terms of Service",
    updated: APP_LEGAL_UPDATED_AT,
    sections: [
      {
        title: "Chấp nhận điều khoản",
        body: [
          `Bằng việc truy cập hoặc sử dụng ${APP_DISPLAY_NAME}, người dùng đồng ý sử dụng ứng dụng đúng mục đích tạo nội dung, quản lý resource và đăng tải nội dung do người dùng có quyền sử dụng.`,
          "Nếu không đồng ý với các điều khoản này, người dùng nên ngừng sử dụng ứng dụng.",
        ],
      },
      {
        title: "Trách nhiệm nội dung",
        body: [
          "Người dùng chịu trách nhiệm về văn bản, audio, video, hình ảnh, nhạc nền, metadata và mọi nội dung được đưa vào hoặc xuất ra từ ứng dụng.",
          "Người dùng không nên tải lên, tạo hoặc đăng nội dung vi phạm bản quyền, quyền riêng tư, điều khoản của nền tảng, hoặc quy định pháp luật hiện hành.",
        ],
      },
      {
        title: "Công cụ local và công cụ bên thứ ba",
        body: [
          "Một số tính năng phụ thuộc vào công cụ local như Piper hoặc FFmpeg. Nếu thiết bị chưa cài công cụ tương ứng, tính năng đó có thể bị tắt cho đến khi người dùng cài đặt và cấp quyền local access.",
          "Các dịch vụ bên thứ ba như Google/YouTube hoặc ElevenLabs có thể có điều khoản, quota, chi phí và chính sách riêng. Người dùng cần tự kiểm tra trước khi sử dụng.",
        ],
      },
      {
        title: "Kết nối YouTube",
        body: [
          "Ứng dụng chỉ thực hiện thao tác YouTube khi người dùng chủ động kết nối tài khoản và bấm thao tác liên quan. Người dùng có thể ngắt kết nối trong ứng dụng hoặc thu hồi quyền từ tài khoản Google.",
          "Người dùng chịu trách nhiệm đảm bảo video, tiêu đề, mô tả, tag, lịch đăng và các cài đặt khác phù hợp với chính sách YouTube.",
        ],
      },
      {
        title: "Giới hạn trách nhiệm",
        body: [
          "Ứng dụng được cung cấp như một công cụ hỗ trợ tạo nội dung. Ứng dụng không bảo đảm rằng mọi file tạo ra sẽ tương thích với mọi trình duyệt, thiết bị, nền tảng đăng tải hoặc yêu cầu kiếm tiền của từng nền tảng.",
          "Người dùng nên kiểm tra lại nội dung trước khi đăng công khai.",
        ],
      },
      {
        title: "Thông tin Google OAuth",
        body: [
          `Home page: ${APP_HOME_URL}`,
          `Privacy policy: ${APP_PRIVACY_URL}`,
          `Terms of service: ${APP_TERMS_URL}`,
          `Authorized domain: ${APP_AUTHORIZED_DOMAIN}`,
        ],
      },
    ],
  };
}

function getTermsEn(): LegalCopy {
  return {
    pageTitle: "Terms of Service",
    pageDescription: `Basic terms for using ${APP_DISPLAY_NAME} to create narration, generate videos, manage resources, and connect YouTube.`,
    badge: "Terms of Service",
    updated: APP_LEGAL_UPDATED_AT,
    sections: [
      {
        title: "Acceptance of terms",
        body: [
          `By accessing or using ${APP_DISPLAY_NAME}, the user agrees to use the app for content creation, resource management, and publishing content that the user has the right to use.`,
          "If the user does not agree with these terms, the user should stop using the app.",
        ],
      },
      {
        title: "User content responsibility",
        body: [
          "The user is responsible for all text, audio, video, images, background music, metadata, and content imported into or exported from the app.",
          "The user should not upload, create, or publish content that violates copyright, privacy rights, platform terms, or applicable laws.",
        ],
      },
      {
        title: "Local tools and third-party services",
        body: [
          "Some features depend on local tools such as Piper or FFmpeg. If the device does not have the required tool installed, the related feature may be disabled until the user installs it and grants local access.",
          "Third-party services such as Google/YouTube or ElevenLabs may have their own terms, quotas, costs, and policies. The user should review them before use.",
        ],
      },
      {
        title: "YouTube connection",
        body: [
          "The app only performs YouTube actions when the user connects an account and triggers a related action. The user can disconnect in the app or revoke access from their Google Account.",
          "The user is responsible for ensuring that the video, title, description, tags, schedule, and other settings comply with YouTube policies.",
        ],
      },
      {
        title: "Limitation of liability",
        body: [
          "The app is provided as a content creation tool. The app does not guarantee that every generated file will be compatible with every browser, device, publishing platform, or monetization requirement.",
          "The user should review all content before publishing it publicly.",
        ],
      },
      {
        title: "Google OAuth information",
        body: [
          `Home page: ${APP_HOME_URL}`,
          `Privacy policy: ${APP_PRIVACY_URL}`,
          `Terms of service: ${APP_TERMS_URL}`,
          `Authorized domain: ${APP_AUTHORIZED_DOMAIN}`,
        ],
      },
    ],
  };
}
