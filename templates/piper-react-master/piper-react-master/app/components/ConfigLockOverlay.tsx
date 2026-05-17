import { Link } from "react-router";
import { AppIcon } from "./AppHeader";
import { useI18n } from "../i18n";

export function ConfigLockOverlay({
  title,
  description,
  settingsTo,
}: {
  title: string;
  description: string;
  settingsTo: string;
}) {
  const { t } = useI18n();

  return (
    <Link className="configLockOverlay" to={settingsTo} aria-label={title}>
      <span className="configLockIcon">
        <AppIcon name="lock" className="size-8" />
      </span>
      <span className="configLockContent">
        <strong>{title}</strong>
        <small>{description}</small>
        <span className="configLockButton">{t("configGateSettingsAction")}</span>
      </span>
    </Link>
  );
}
