import { ScrollView, Pressable, StyleSheet, View } from "react-native";
import { LANGUAGE_OPTIONS } from "@/lib/constants/i18n";
import { currencyOptions } from "@/lib/constants/currency";
import { languageFlags } from "@/features/onboarding/constants";
import { THEME_VARIANTS } from "@/constants/themeVariant";
import { useOnboardingFlow } from "@/features/onboarding/hooks/useOnboarding";
import { ThemedText } from "@/components/ThemedText";
import { ScreenView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/lib/themeProvider";

export function OnboardingScreen() {
  const {
    t,
    step,
    expandedStep,
    selectedLanguage,
    selectedCurrency,
    selectedTheme,
    selectedThemeVariant,
    saving,
    setSelectedLanguage,
    setSelectedCurrency,
    setSelectedTheme,
    setSelectedThemeVariant,
    handleLanguageConfirm,
    handleThemeConfirm,
    handlePaletteConfirm,
    handleCurrencyConfirm,
    toggleStep,
    getLanguageLabel,
    getCurrencyLabel,
  } = useOnboardingFlow();
  const { colors } = useTheme();

  const themeOptions = [
    { value: "light", label: t("onboarding.themeLight") ?? t("onboarding.lightMode") ?? "Light" },
    { value: "dark", label: t("onboarding.themeDark") ?? t("onboarding.darkMode") ?? "Dark" },
  ] as const;

  return (
    <ScreenView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>{t("onboarding.title") ?? "Welcome"}</ThemedText>
          <ThemedText tone="muted" style={styles.subtitle}>
            {t("onboarding.subtitle") ?? "Set up your preferences"}
          </ThemedText>
        </View>

        <View style={styles.stack}>
          <Card style={styles.card}>
            <Pressable onPress={() => toggleStep(1)} style={styles.cardHeader}>
              <ThemedText style={styles.cardTitle}>{t("onboarding.languageLabel") ?? "Language"}</ThemedText>
              {step > 1 && expandedStep !== 1 ? (
                <ThemedText tone="muted">
                  {languageFlags[selectedLanguage]} {getLanguageLabel(selectedLanguage)}
                </ThemedText>
              ) : null}
            </Pressable>
            {expandedStep === 1 ? (
              <View style={styles.sectionBody}>
                <View style={styles.optionGrid}>
                  {LANGUAGE_OPTIONS.map((option) => {
                    const selected = selectedLanguage === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setSelectedLanguage(option.value)}
                        style={[
                          styles.optionCard,
                          { borderColor: selected ? colors.primary : colors.border },
                          selected && { backgroundColor: colors.card },
                        ]}
                      >
                        <View style={styles.optionRow}>
                          <ThemedText style={styles.optionFlag}>{languageFlags[option.value]}</ThemedText>
                          <ThemedText style={styles.optionLabel}>{getLanguageLabel(option.value)}</ThemedText>
                        </View>
                        {selected ? <ThemedText style={styles.optionCheck}>✓</ThemedText> : null}
                      </Pressable>
                    );
                  })}
                </View>
                <Button title={t("common.continue") ?? "Continue"} onPress={handleLanguageConfirm} />
              </View>
            ) : null}
          </Card>

          <Card style={styles.card}>
            <Pressable onPress={() => toggleStep(2)} style={styles.cardHeader}>
              <ThemedText style={styles.cardTitle}>{t("onboarding.themeTitle") ?? "Theme"}</ThemedText>
              {step > 2 && expandedStep !== 2 ? (
                <ThemedText tone="muted">
                  {selectedTheme === "light" ? themeOptions[0].label : themeOptions[1].label}
                </ThemedText>
              ) : null}
            </Pressable>
            {expandedStep === 2 ? (
              <View style={styles.sectionBody}>
                <View style={styles.optionGrid}>
                  {themeOptions.map((option) => {
                    const selected = selectedTheme === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setSelectedTheme(option.value)}
                        style={[
                          styles.optionCard,
                          { borderColor: selected ? colors.primary : colors.border },
                          selected && { backgroundColor: colors.card },
                        ]}
                      >
                        <ThemedText style={styles.optionLabel}>{option.label}</ThemedText>
                        {selected ? <ThemedText style={styles.optionCheck}>✓</ThemedText> : null}
                      </Pressable>
                    );
                  })}
                </View>
                <Button title={t("common.continue") ?? "Continue"} onPress={handleThemeConfirm} />
              </View>
            ) : null}
          </Card>

          <Card style={styles.card}>
            <Pressable onPress={() => toggleStep(3)} style={styles.cardHeader}>
              <ThemedText style={styles.cardTitle}>{t("profile.themeStyle") ?? "Theme style"}</ThemedText>
              {step > 3 && expandedStep !== 3 ? (
                <ThemedText tone="muted">
                  {t(THEME_VARIANTS.find((variant) => variant.id === selectedThemeVariant)?.labelKey ?? "") ||
                    selectedThemeVariant}
                </ThemedText>
              ) : null}
            </Pressable>
            {expandedStep === 3 ? (
              <View style={styles.sectionBody}>
                <View style={styles.paletteGrid}>
                  {THEME_VARIANTS.map((variant) => {
                    const selected = selectedThemeVariant === variant.id;
                    return (
                      <Pressable
                        key={variant.id}
                        onPress={() => setSelectedThemeVariant(variant.id)}
                        style={[
                          styles.paletteCard,
                          { borderColor: selected ? colors.primary : colors.border },
                          selected && { backgroundColor: colors.card },
                        ]}
                      >
                        <View style={styles.paletteHeader}>
                          <ThemedText style={styles.optionLabel}>
                            {t(variant.labelKey) ?? variant.id}
                          </ThemedText>
                          {selected ? <ThemedText style={styles.optionCheck}>✓</ThemedText> : null}
                        </View>
                        <ThemedText tone="muted" style={styles.paletteDescription}>
                          {t(variant.descriptionKey) ?? ""}
                        </ThemedText>
                        <View style={styles.palettePreview}>
                          <View style={[styles.paletteDot, { backgroundColor: variant.preview.primary }]} />
                          <View style={[styles.paletteDot, { backgroundColor: variant.preview.secondary }]} />
                          <View style={[styles.paletteDot, { backgroundColor: variant.preview.accent }]} />
                          <View style={[styles.paletteDot, { backgroundColor: variant.preview.nav }]} />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
                <Button title={t("common.continue") ?? "Continue"} onPress={handlePaletteConfirm} />
              </View>
            ) : null}
          </Card>

          <Card style={styles.card}>
            <Pressable onPress={() => toggleStep(4)} style={styles.cardHeader}>
              <ThemedText style={styles.cardTitle}>{t("onboarding.currencyTitle") ?? "Currency"}</ThemedText>
              {step > 4 && expandedStep !== 4 ? (
                <ThemedText tone="muted">{getCurrencyLabel(selectedCurrency)}</ThemedText>
              ) : null}
            </Pressable>
            {expandedStep === 4 ? (
              <View style={styles.sectionBody}>
                <View style={styles.optionGrid}>
                  {currencyOptions.map((option) => {
                    const selected = selectedCurrency === option.code;
                    return (
                      <Pressable
                        key={option.code}
                        onPress={() => setSelectedCurrency(option.code)}
                        style={[
                          styles.optionCard,
                          { borderColor: selected ? colors.primary : colors.border },
                          selected && { backgroundColor: colors.card },
                        ]}
                      >
                        <View style={styles.optionRow}>
                          <ThemedText style={styles.optionFlag}>{option.flag}</ThemedText>
                          <ThemedText style={styles.optionLabel}>{getCurrencyLabel(option.code)}</ThemedText>
                        </View>
                        {selected ? <ThemedText style={styles.optionCheck}>✓</ThemedText> : null}
                      </Pressable>
                    );
                  })}
                </View>
                {t("onboarding.currencyWarning") ? (
                  <ThemedText tone="muted" style={styles.warningText}>
                    {t("onboarding.currencyWarning")}
                  </ThemedText>
                ) : null}
                <Button
                  title={saving ? t("onboarding.currencySaving") ?? "Saving..." : t("common.complete") ?? "Finish"}
                  onPress={handleCurrencyConfirm}
                  loading={saving}
                />
              </View>
            ) : null}
          </Card>
        </View>
      </ScrollView>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 8,
    textAlign: "center",
  },
  stack: {
    gap: 12,
  },
  card: {
    padding: 18,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionBody: {
    gap: 12,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexGrow: 1,
    minWidth: "45%",
    justifyContent: "space-between",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  optionFlag: {
    fontSize: 20,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  optionCheck: {
    fontSize: 16,
    fontWeight: "700",
    alignSelf: "flex-end",
  },
  paletteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  paletteCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 8,
    width: "48%",
  },
  paletteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paletteDescription: {
    fontSize: 12,
  },
  palettePreview: {
    flexDirection: "row",
    gap: 8,
  },
  paletteDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  warningText: {
    fontSize: 12,
  },
});
