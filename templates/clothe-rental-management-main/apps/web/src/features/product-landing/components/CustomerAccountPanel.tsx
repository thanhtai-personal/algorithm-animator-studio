"use client";

import { observer } from "mobx-react-lite";
import { useI18n } from "@/lib/i18n";
import { useCustomerAccountPanel } from "@/features/product-landing/hooks/useCustomerAccountPanel";

export const CustomerAccountPanel = observer(function CustomerAccountPanel() {
  const { t } = useI18n();
  const model = useCustomerAccountPanel();

  if (!model.showPanel) {
    return null;
  }

  return (
    <section className="border-b border-border bg-card/40">
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <div className="rounded-2xl border border-border bg-card p-4 md:p-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground">
              {t("customerAccount.title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("customerAccount.subtitle")}
            </p>
          </div>

          {model.isLoadingProfile ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {t("customerAccount.loading")}
            </p>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <form
                key={model.profileFormKey}
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  void model.submitProfile({
                    fullName:
                      typeof formData.get("fullName") === "string"
                        ? (formData.get("fullName") as string)
                        : "",
                    email:
                      typeof formData.get("email") === "string"
                        ? (formData.get("email") as string)
                        : "",
                    phone:
                      typeof formData.get("phone") === "string"
                        ? (formData.get("phone") as string)
                        : "",
                  });
                }}
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="customer-full-name">
                    {t("customerAccount.fullNameLabel")}
                  </label>
                  <input
                    id="customer-full-name"
                    name="fullName"
                    type="text"
                    defaultValue={model.profile?.fullName ?? ""}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="customer-email">
                    {t("customerAccount.emailLabel")}
                  </label>
                  <input
                    id="customer-email"
                    name="email"
                    type="email"
                    defaultValue={model.profile?.email ?? ""}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="customer-phone">
                    {t("customerAccount.phoneLabel")}
                  </label>
                  <input
                    id="customer-phone"
                    name="phone"
                    type="tel"
                    defaultValue={model.profile?.phone ?? ""}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                  />
                </div>

                <button
                  type="submit"
                  disabled={model.isSavingProfile}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {model.isSavingProfile
                    ? t("customerAccount.profileSaving")
                    : t("customerAccount.profileSubmit")}
                </button>
              </form>

              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void model.submitPassword();
                }}
              >
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-foreground">
                    {t("customerAccount.passwordTitle")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("customerAccount.passwordHint")}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="customer-password">
                    {t("customerAccount.newPasswordLabel")}
                  </label>
                  <input
                    id="customer-password"
                    type="password"
                    required
                    value={model.newPassword}
                    onChange={(event) => model.setNewPassword(event.target.value)}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-foreground"
                    htmlFor="customer-password-confirm"
                  >
                    {t("customerAccount.confirmPasswordLabel")}
                  </label>
                  <input
                    id="customer-password-confirm"
                    type="password"
                    required
                    value={model.confirmPassword}
                    onChange={(event) => model.setConfirmPassword(event.target.value)}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                  />
                </div>

                <button
                  type="submit"
                  disabled={model.isUpdatingPassword}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {model.isUpdatingPassword
                    ? t("customerAccount.passwordSaving")
                    : t("customerAccount.passwordSubmit")}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  );
});
