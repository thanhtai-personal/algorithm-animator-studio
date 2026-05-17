#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const changed = [];
const skipped = [];

function file(rel) {
  return path.join(root, rel);
}

function read(rel) {
  return fs.readFileSync(file(rel), 'utf8');
}

function write(rel, content, previous) {
  if (content !== previous) {
    fs.writeFileSync(file(rel), content, 'utf8');
    changed.push(rel);
  }
}

function replaceAllSafe(source, search, replacement, label) {
  const next = source.split(search).join(replacement);
  if (next === source) skipped.push(label || String(search).slice(0, 80));
  return next;
}

function replaceRegexSafe(source, pattern, replacement, label) {
  const next = source.replace(pattern, replacement);
  if (next === source) skipped.push(label || pattern.toString());
  return next;
}

const translationKeys = {
  en: {
    settingsNav: 'Settings',
    themeLabel: 'Theme',
    paletteLabel: 'Palette',
    settingsPageTitle: 'Settings',
    settingsPageDescription: 'Manage device identity, app configuration, YouTube, PRO voices, and local runtime settings.',
    settingsVariablesCount: '{count} settings',
    settingsSave: 'Save settings',
    settingsSaving: 'Saving...',
    settingsSaved: 'Settings saved.',
    settingsShowSensitive: 'Show sensitive values',
    settingsHideSensitive: 'Hide sensitive values',
    settingsResetDefaults: 'Reset defaults',
    settingsSensitiveMissingBadge: 'Missing key/voice id',
    settingsSensitiveReadyBadge: 'Required sensitive settings are ready',
    settingsStorageBadge: 'localStorage + cloud sync',
    settingsDeviceCloudHelp: 'Each installed device has its own Device ID. The default device name comes from the machine name returned by the Settings API, and can be changed only once to avoid confusing synced devices.',
    settingsMissingKeysPrefix: 'Missing:',
    settingsDeviceTab: 'Device',
    settingsAppServerTab: 'App & server',
    settingsYoutubeTab: 'YouTube',
    settingsProVoicesTab: 'PRO voices',
    settingsDeviceInterfaceTitle: 'Device',
    settingsDeviceInterfaceDescription: 'Device identity used to sync settings for this installation.',
    settingsDeviceId: 'Device ID',
    settingsDeviceIdHelp: 'Auto-generated ID used to sync settings to the right device.',
    settingsDeviceName: 'Device name',
    settingsDeviceNameHelp: 'Defaults to the machine name. You can change it once to make the device easier to recognize.',
    settingsDeviceNameLockedHelp: 'This device name has already been changed once and is now locked.',
    settingsMachineName: 'Machine name',
    settingsMachineNameHelp: 'Returned by the Settings API. Browsers cannot read the real machine hostname directly.',
    settingsUnlockTitle: 'Unlock App & server',
    settingsUnlockDescription: 'App & server settings affect backend URLs, Local voice and FFmpeg paths, so they require a passkey before editing.',
    settingsUnlocked: 'Unlocked',
    settingsLocked: 'Locked',
    settingsUnlockToEdit: 'Enter passkey to edit',
    settingsPasskeyPlaceholder: 'Enter passkey, default 020321',
    settingsUnlockButton: 'Unlock',
    settingsPasskeyError: 'Wrong passkey. The initial default is 020321.',
    settingsDefaultValuePrefix: 'Default:',
    settingsSensitiveHiddenHelp: 'Sensitive value. It is always hidden on screen.',
    errorOops: 'Oops!',
    errorUnexpected: 'An unexpected error occurred.',
    errorTitle: 'Error',
    errorNotFound: 'The requested page could not be found.',
    webExtractSelectorPlaceholder: 'article, main, .chapter-content',
    resourcePreviousPage: 'Previous',
    resourceNextPage: 'Next',
    resourcePageStatus: 'Page {page} of {total}',
  },
  vi: {
    settingsNav: 'Cài đặt',
    themeLabel: 'Giao diện',
    paletteLabel: 'Bảng màu',
    settingsPageTitle: 'Cài đặt',
    settingsPageDescription: 'Quản lý định danh thiết bị, cấu hình app, YouTube, giọng PRO và thiết lập chạy local.',
    settingsVariablesCount: '{count} thiết lập',
    settingsSave: 'Lưu cài đặt',
    settingsSaving: 'Đang lưu...',
    settingsSaved: 'Đã lưu cài đặt.',
    settingsShowSensitive: 'Hiện thông tin nhạy cảm',
    settingsHideSensitive: 'Ẩn thông tin nhạy cảm',
    settingsResetDefaults: 'Reset mặc định',
    settingsSensitiveMissingBadge: 'Cần bổ sung key/voice id',
    settingsSensitiveReadyBadge: 'Đã đủ cấu hình nhạy cảm chính',
    settingsStorageBadge: 'localStorage + đồng bộ cloud',
    settingsDeviceCloudHelp: 'Mỗi máy cài app có một Device ID riêng. Tên định danh mặc định lấy từ tên máy do Settings API trả về; tên này chỉ được đổi một lần để tránh nhầm thiết bị khi đồng bộ cấu hình.',
    settingsMissingKeysPrefix: 'Thiếu:',
    settingsDeviceTab: 'Thiết bị',
    settingsAppServerTab: 'App & server',
    settingsYoutubeTab: 'YouTube',
    settingsProVoicesTab: 'Giọng PRO',
    settingsDeviceInterfaceTitle: 'Thiết bị',
    settingsDeviceInterfaceDescription: 'Định danh thiết bị dùng để đồng bộ cài đặt cho đúng bản cài này.',
    settingsDeviceId: 'Device ID',
    settingsDeviceIdHelp: 'ID tự sinh, dùng để đồng bộ settings cho đúng thiết bị.',
    settingsDeviceName: 'Tên định danh',
    settingsDeviceNameHelp: 'Mặc định là tên máy. Bạn chỉ nên đổi một lần khi cần dễ nhận diện.',
    settingsDeviceNameLockedHelp: 'Tên định danh đã đổi một lần và đang bị khóa.',
    settingsMachineName: 'Tên máy',
    settingsMachineNameHelp: 'Do Settings API trả về. Browser không tự đọc được hostname thật của máy.',
    settingsUnlockTitle: 'Mở khóa App & server',
    settingsUnlockDescription: 'Nhóm App & server ảnh hưởng đường dẫn backend, Local voice và FFmpeg nên cần passkey trước khi sửa.',
    settingsUnlocked: 'Đã mở khóa',
    settingsLocked: 'Đang khóa',
    settingsUnlockToEdit: 'Nhập passkey để sửa',
    settingsPasskeyPlaceholder: 'Nhập passkey, mặc định 020321',
    settingsUnlockButton: 'Mở khóa',
    settingsPasskeyError: 'Passkey không đúng. Mặc định ban đầu là 020321.',
    settingsDefaultValuePrefix: 'Mặc định:',
    settingsSensitiveHiddenHelp: 'Thông tin nhạy cảm, luôn được ẩn trên màn hình.',
    errorOops: 'Có lỗi rồi!',
    errorUnexpected: 'Đã xảy ra lỗi ngoài dự kiến.',
    errorTitle: 'Lỗi',
    errorNotFound: 'Không tìm thấy trang được yêu cầu.',
    webExtractSelectorPlaceholder: 'article, main, .chapter-content',
    resourcePreviousPage: 'Trước',
    resourceNextPage: 'Sau',
    resourcePageStatus: 'Trang {page}/{total}',
  },
};

function ensureI18nKeys() {
  const rel = 'app/i18n.tsx';
  if (!fs.existsSync(file(rel))) return;
  const original = read(rel);
  let content = original;

  function addKeysForLocale(locale, anchorRegex) {
    const missingEntries = Object.entries(translationKeys[locale]).filter(([key]) => !new RegExp(`\\b${key}\\s*:`).test(content));
    if (!missingEntries.length) return;
    const block = missingEntries
      .map(([key, value]) => `    ${key}: ${JSON.stringify(value)},`)
      .join('\n');
    content = content.replace(anchorRegex, (match) => `${match}\n${block}`);
  }

  addKeysForLocale('en', /(    vietnamese:\s*['\"`]Vietnamese['\"`],)/);
  addKeysForLocale('vi', /(    vietnamese:\s*['\"`]Tiếng Việt['\"`],)/);
  write(rel, content, original);
}

function normalizeAppHeader() {
  const rel = 'app/components/AppHeader.tsx';
  if (!fs.existsSync(file(rel))) return;
  const original = read(rel);
  let content = original;

  content = content.replace(
    /const settingsNavItem = \{ to: "\/settings", label: "Settings", icon: "settings" \} as const;/,
    'const settingsNavItem = { to: "/settings", labelKey: "settingsNav", icon: "settings" } as const;'
  );
  content = content.replace(
    /<span className="font-medium">\{settingsNavItem\.label\}<\/span>/,
    '<span className="font-medium">{t(settingsNavItem.labelKey)}</span>'
  );
  content = content.replace(
    /\{"labelKey" in item \? t\(item\.labelKey\) : item\.label\}/g,
    '{"labelKey" in item ? t(item.labelKey) : "label" in item ? item.label : ""}'
  );

  write(rel, content, original);
}

function normalizeRootErrorBoundary() {
  const rel = 'app/root.tsx';
  if (!fs.existsSync(file(rel))) return;
  const original = read(rel);
  let content = original;

  // ErrorBoundary is intentionally not tied to React context because it can render outside the app provider.
  // Use a tiny language detector so error pages are localized too.
  if (!content.includes('function getRootErrorText')) {
    content = content.replace(
      /export function ErrorBoundary\(\{ error \}: Route\.ErrorBoundaryProps\) \{\n  let message = "Oops!";\n  let details = "An unexpected error occurred\.";/,
      `export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {\n  const errorText = getRootErrorText();\n  let message = errorText.oops;\n  let details = errorText.unexpected;`
    );
    content = content.replace(/message = error\.status === 404 \? "404" : "Error";/, 'message = error.status === 404 ? "404" : errorText.error;');
    content = content.replace(/\? "The requested page could not be found\."/, '? errorText.notFound');
    content += `\n\nfunction getRootErrorText() {\n  const language = typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("vi") ? "vi" : "en";\n\n  if (language === "vi") {\n    return {\n      oops: "Có lỗi rồi!",\n      unexpected: "Đã xảy ra lỗi ngoài dự kiến.",\n      error: "Lỗi",\n      notFound: "Không tìm thấy trang được yêu cầu.",\n    };\n  }\n\n  return {\n    oops: "Oops!",\n    unexpected: "An unexpected error occurred.",\n    error: "Error",\n    notFound: "The requested page could not be found.",\n  };\n}\n`;
  }

  write(rel, content, original);
}

function normalizeWebTextExtractor() {
  const rel = 'app/components/WebTextExtractor.tsx';
  if (!fs.existsSync(file(rel))) return;
  const original = read(rel);
  let content = original;
  content = content.replace(/placeholder="article, main, \.chapter-content"/g, 'placeholder={t("webExtractSelectorPlaceholder")}');
  write(rel, content, original);
}

function normalizeSettingsPage() {
  const rel = 'app/components/settings/SettingsPage.tsx';
  if (!fs.existsSync(file(rel))) return;
  const original = read(rel);
  let content = original;

  if (!content.includes('useI18n')) {
    content = content.replace(/import \{ AppShell, Field, PageHeader, StatusBadge \} from "\.\.\/AppHeader";/, 'import { AppShell, Field, PageHeader, StatusBadge } from "../AppHeader";\nimport { useI18n } from "../../i18n";');
    content = content.replace(/export function SettingsPage\(\) \{/, 'export function SettingsPage() {\n  const { t } = useI18n();');
  }

  content = content.replace(/setPasskeyError\("Passkey không đúng\. Mặc định ban đầu là 020321\."\);/g, 'setPasskeyError(t("settingsPasskeyError"));');
  content = content.replace(/setSavedMessage\("Đã lưu settings vào localStorage\. Các request mới sẽ dùng cấu hình này\."\);/g, 'setSavedMessage(t("settingsSaved"));');
  content = content.replace(/setSavedMessage\("Đã lưu settings\."\);/g, 'setSavedMessage(t("settingsSaved"));');
  content = content.replace(/setSavedMessage\("Đã xoá settings trong localStorage và quay về mặc định\."\);/g, 'setSavedMessage(t("settingsSaved"));');

  content = content.replace(/title="Settings"/g, 'title={t("settingsPageTitle")}');
  content = content.replace(/description="Quản lý cấu hình env, thiết bị, theme và đồng bộ settings qua Supabase Settings API\."/g, 'description={t("settingsPageDescription")}');
  content = content.replace(/description="Quản lý định danh thiết bị, cấu hình app, YouTube, PRO voices, và local runtime settings\."/g, 'description={t("settingsPageDescription")}');
  content = content.replace(/<StatusBadge>\{Object\.keys\(settings\)\.length\} biến<\/StatusBadge>/g, '<StatusBadge>{t("settingsVariablesCount", { count: Object.keys(settings).length })}</StatusBadge>');
  content = content.replace(/\{isSyncing \? "Đang lưu\.\.\." : "Lưu settings"\}/g, '{isSyncing ? t("settingsSaving") : t("settingsSave")}');
  content = content.replace(/\{isSyncing \? "Đang lưu\.\.\." : "Lưu cài đặt"\}/g, '{isSyncing ? t("settingsSaving") : t("settingsSave")}');
  content = content.replace(/\{showSensitive \? "Ẩn thông tin nhạy cảm" : "Hiện thông tin nhạy cảm"\}/g, '{showSensitive ? t("settingsHideSensitive") : t("settingsShowSensitive")}');
  content = content.replace(/Reset mặc định/g, '{t("settingsResetDefaults")}');
  content = content.replace(/\{sensitiveMissing\.length \? "Cần bổ sung key\/voice id" : "Đã đủ cấu hình nhạy cảm chính"\}/g, '{sensitiveMissing.length ? t("settingsSensitiveMissingBadge") : t("settingsSensitiveReadyBadge")}');
  content = content.replace(/<StatusBadge>localStorage \+ Supabase<\/StatusBadge>/g, '<StatusBadge>{t("settingsStorageBadge")}</StatusBadge>');
  content = content.replace(/Mỗi máy cài app có một Device ID riêng\. Tên định danh mặc định lấy từ tên máy do Settings API trả về; tên này chỉ được đổi một lần để tránh nhầm thiết bị khi đồng bộ cấu hình\./g, '{t("settingsDeviceCloudHelp")}');
  content = content.replace(/<p className="text-sm text-destructive">Thiếu: \{sensitiveMissing\.join\(", "\)\}<\/p>/g, '<p className="text-sm text-destructive">{t("settingsMissingKeysPrefix")} {sensitiveMissing.join(", ")}</p>');

  content = content.replace(/<h2 className="text-xl font-display font-semibold">Thiết bị & giao diện<\/h2>/g, '<h2 className="text-xl font-display font-semibold">{t("settingsDeviceInterfaceTitle")}</h2>');
  content = content.replace(/<p className="mt-1 text-sm text-muted-foreground">Định danh máy, theme sáng\/tối và bảng màu của app\.<\/p>/g, '<p className="mt-1 text-sm text-muted-foreground">{t("settingsDeviceInterfaceDescription")}</p>');
  content = content.replace(/<Field label="Device ID" hint="ID tự sinh, dùng để đồng bộ settings cho đúng thiết bị\."/g, '<Field label={t("settingsDeviceId")} hint={t("settingsDeviceIdHelp")}');
  content = content.replace(/<Field label="Tên định danh" hint=\{identity\.nameChanged \? "Tên định danh đã đổi một lần, API sẽ không cho đổi tiếp\." : "Mặc định là tên máy\. Bạn chỉ nên đổi một lần khi cần dễ nhận diện\."\}/g, '<Field label={t("settingsDeviceName")} hint={identity.nameChanged ? t("settingsDeviceNameLockedHelp") : t("settingsDeviceNameHelp")}');
  content = content.replace(/<Field label="Tên máy" hint="Do Settings API đọc từ máy chạy backend\. Browser không tự đọc được hostname thật\."/g, '<Field label={t("settingsMachineName")} hint={t("settingsMachineNameHelp")}');
  content = content.replace(/<Field label="Theme mode">/g, '<Field label={t("themeLabel")}>');
  content = content.replace(/<Field label="Palette">/g, '<Field label={t("paletteLabel")}>');

  content = content.replace(/<h2 className="text-xl font-display font-semibold">Mở khóa App & server<\/h2>/g, '<h2 className="text-xl font-display font-semibold">{t("settingsUnlockTitle")}</h2>');
  content = content.replace(/<p className="mt-1 text-sm text-muted-foreground">Nhóm App & server ảnh hưởng đường dẫn backend, Local voice và FFmpeg nên cần passkey trước khi sửa\.<\/p>/g, '<p className="mt-1 text-sm text-muted-foreground">{t("settingsUnlockDescription")}</p>');
  content = content.replace(/\{appSettingsUnlocked \? "Đã mở khóa" : "Đang khóa"\}/g, '{appSettingsUnlocked ? t("settingsUnlocked") : t("settingsLocked")}');
  content = content.replace(/placeholder="Nhập passkey, mặc định 020321"/g, 'placeholder={t("settingsPasskeyPlaceholder")}');
  content = content.replace(/<StatusBadge>Nhập passkey để sửa<\/StatusBadge>/g, '<StatusBadge>{t("settingsUnlockToEdit")}</StatusBadge>');
  content = content.replace(/<span className="block mt-1">Mặc định: <code>\{definition\.defaultValue\}<\/code><\/span>/g, '<span className="block mt-1">{t("settingsDefaultValuePrefix")} <code>{definition.defaultValue}</code></span>');
  content = content.replace(/<span className="block mt-1">Thông tin nhạy cảm: không có giá trị mặc định\.<\/span>/g, '<span className="block mt-1">{t("settingsSensitiveHiddenHelp")}</span>');

  write(rel, content, original);
}

function normalizeResourcePage() {
  const rel = 'app/components/resources/ResourcePage.tsx';
  if (!fs.existsSync(file(rel))) return;
  const original = read(rel);
  let content = original;
  // Current resource page already uses i18n for most visible text. Keep this hook for future pagination labels.
  content = content.replace(/>Previous<\/button>/g, '>{t("resourcePreviousPage")}</button>');
  content = content.replace(/>Next<\/button>/g, '>{t("resourceNextPage")}</button>');
  write(rel, content, original);
}

ensureI18nKeys();
normalizeAppHeader();
normalizeRootErrorBoundary();
normalizeWebTextExtractor();
normalizeSettingsPage();
normalizeResourcePage();

console.log('Localization normalization complete.');
if (changed.length) {
  console.log('Changed files:');
  for (const rel of changed) console.log(`- ${rel}`);
} else {
  console.log('No file changes were needed.');
}
if (skipped.length) {
  console.log('\nSkipped patterns (usually already normalized or source variant differs):');
  for (const item of [...new Set(skipped)].slice(0, 30)) console.log(`- ${item}`);
}
