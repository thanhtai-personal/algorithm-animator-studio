import { observer } from "mobx-react-lite";
import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { Animated, Easing, FlatList, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { startOfMonth, startOfWeek, startOfYear, endOfMonth, endOfWeek, endOfYear } from "date-fns";

import { ScreenView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/lib/themeProvider";
import { formatCompactNumber, formatCurrency } from "@/lib/currency";
import type { Transaction, TransactionInput } from "@/features/transactions/types";
import { EditTransactionModal } from "@/features/transactions/components/EditTransactionModal";
import { TransactionDetailModal } from "@/features/transactions/components/TransactionDetailModal";
import { StatsTransactionList } from "@/features/transactions/components/TransactionList";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { PieChart } from "@/features/stats/components/PieChart";
import { useProStatsData } from "@/features/stats/hooks/useProStatsData";
import { transactionStore } from "@/store/transactionStore";
import { categoryStore } from "@/store/categoryStore";
import { CategoryModal } from "@/features/categories/components/CategoryModal";
import type { CategoryInput, CategoryRow } from "@/features/categories/types";
import { CHART_COLORS, PAGE_SIZE } from "@/features/stats/constants";

const CATEGORY_BAR_GAP = 6;
const CATEGORY_BAR_LABEL_WIDTH = 96;
const CATEGORY_BAR_GAP_TOTAL = CATEGORY_BAR_LABEL_WIDTH + CATEGORY_BAR_GAP * 2;

export const StatsScreen = observer(function StatsScreen() {
  const { colors } = useTheme();
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [detailTarget, setDetailTarget] = useState<Transaction | null>(null);
  const [rangeTarget, setRangeTarget] = useState<null | "summary" | "period" | "category" | "list">(null);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [categoryExpanded, setCategoryExpanded] = useState(true);
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryCreateOpen, setCategoryCreateOpen] = useState(false);
  const [categoryEditTarget, setCategoryEditTarget] = useState<CategoryRow | null>(null);
  const [categoryDeleteTarget, setCategoryDeleteTarget] = useState<CategoryRow | null>(null);
  const [pieTab, setPieTab] = useState<"income" | "expense">("expense");
  const [categoryContentHeight, setCategoryContentHeight] = useState(0);
  const categoryAnim = useRef(new Animated.Value(categoryExpanded ? 1 : 0)).current;

  const data = useProStatsData();
  const { t, localeCode, currency, language } = data.i18n;
  const categoryDomainMax = Math.max(data.category.domainMax, 1);


  const handleEditSave = (payload: TransactionInput) => {
    if (!editTarget) return;
    transactionStore.upsert({
      ...editTarget,
      amount: payload.amount,
      description: payload.description,
      type: payload.type,
      categoryId: payload.categoryId,
      date: payload.date,
    });
    setEditTarget(null);
  };

  const handleCreateCategory = (input: CategoryInput) => {
    const id = `cat_${Date.now()}`;
    categoryStore.upsert({
      id,
      user_id: null,
      anon_key: null,
      name: input.name,
      icon: input.icon ?? null,
      color: input.color ?? null,
      created_at: new Date().toISOString(),
    });
    setCategoryCreateOpen(false);
  };

  const handleEditCategory = (input: CategoryInput) => {
    if (!categoryEditTarget) return;
    categoryStore.upsert({
      ...categoryEditTarget,
      name: input.name,
      icon: input.icon ?? null,
      color: input.color ?? null,
    });
    setCategoryEditTarget(null);
  };

  const categories = categoryStore.categories;
  const sortedCategories = useMemo(() => {
    return categories
      .map((category, index) => ({ category, index }))
      .sort((a, b) => {
        const aTime = Date.parse(a.category.created_at ?? "");
        const bTime = Date.parse(b.category.created_at ?? "");
        const aValid = Number.isFinite(aTime);
        const bValid = Number.isFinite(bTime);
        if (aValid && bValid && aTime !== bTime) return bTime - aTime;
        if (aValid && !bValid) return -1;
        if (!aValid && bValid) return 1;
        return a.index - b.index;
      })
      .map((item) => item.category);
  }, [categories]);
  const totalCategoryPages = Math.max(1, Math.ceil(sortedCategories.length / PAGE_SIZE));
  const safeCategoryTotalPages =
    Number.isFinite(totalCategoryPages) && totalCategoryPages > 0 ? totalCategoryPages : 1;
  const categoryItems = sortedCategories.slice((categoryPage - 1) * PAGE_SIZE, categoryPage * PAGE_SIZE);

  const rangeLabel = (range: any) => {
    if (!range?.from) return t("stats.rangeAll") ?? "All time";
    return data.formatRangeValue(range, data.i18n.dateFormat, data.i18n.locale);
  };

  const rangePresets = [
    { key: "all", label: t("stats.rangeAll") ?? "All time", range: undefined },
    {
      key: "week",
      label: t("stats.thisWeek") ?? "This week",
      range: { from: startOfWeek(new Date()), to: endOfWeek(new Date()) },
    },
    {
      key: "month",
      label: t("stats.thisMonth") ?? "This month",
      range: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
    },
    {
      key: "year",
      label: t("stats.thisYear") ?? "This year",
      range: { from: startOfYear(new Date()), to: endOfYear(new Date()) },
    },
  ];

  const openRangePicker = (target: "summary" | "period" | "category" | "list") => setRangeTarget(target);
  const closeRangePicker = () => setRangeTarget(null);
  const applyRange = (range: any) => {
    if (rangeTarget === "summary") data.summary.setRange(range);
    if (rangeTarget === "period") data.period.setRange(range);
    if (rangeTarget === "category") data.category.setRange(range);
    if (rangeTarget === "list") data.list.setRange(range);
    closeRangePicker();
  };
  const renderCategoryPickerItem = useCallback(
    ({ item: opt }: { item: (typeof data.list.categoryOptions)[number] }) => {
      const selected = data.list.selectedCategoryIds.includes(opt.id);
      return (
        <Pressable
          style={styles.modalOption}
          onPress={() => {
            if (opt.id === "all") {
              data.list.setSelectedCategoryIds(["all"]);
              return;
            }
            const next = selected
              ? data.list.selectedCategoryIds.filter((id) => id !== opt.id)
              : data.list.selectedCategoryIds.filter((id) => id !== "all").concat(opt.id);
            data.list.setSelectedCategoryIds(next.length ? next : ["all"]);
          }}
        >
          <ThemedText>{opt.name}</ThemedText>
          {selected ? <Ionicons name="checkmark" size={16} color={colors.primary} /> : null}
        </Pressable>
      );
    },
    [colors.primary, data.list]
  );

  useEffect(() => {
    Animated.timing(categoryAnim, {
      toValue: categoryExpanded ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [categoryAnim, categoryExpanded]);

  return (
    <ScreenView style={styles.container}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText style={styles.title}>{t("stats.proTitle") ?? "Statistics"}</ThemedText>
          <ThemedText tone="muted">{t("stats.proSubtitle") ?? "Overview of your finances"}</ThemedText>
        </View>

        <Card style={styles.section}>
          <View style={styles.cardHeader}>
            <View>
              <ThemedText style={styles.cardTitle}>{t("stats.summaryTitle") ?? "This month"}</ThemedText>
              <ThemedText tone="muted" style={styles.cardSubtitle}>
                {t("stats.summarySubtitle") ?? "Monthly summary"}
              </ThemedText>
            </View>
            <View style={styles.rangePill}>
              <ThemedText tone="muted" style={styles.rangeButtonText}>{t("stats.thisMonth") ?? "This month"}</ThemedText>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={[styles.statBlock, { backgroundColor: colors.border }]}>
              <ThemedText tone="muted" style={styles.statLabel}>{t("dashboard.income") ?? "Income"}</ThemedText>
              <ThemedText style={[styles.statValue, styles.incomeValue]}>
                +{formatCurrency(data.summary.totals.income, currency, localeCode)}
              </ThemedText>
            </View>
            <View style={[styles.statBlock, { backgroundColor: colors.border }]}>
              <ThemedText tone="muted" style={styles.statLabel}>{t("dashboard.expense") ?? "Expense"}</ThemedText>
              <ThemedText style={[styles.statValue, styles.expenseValue]}>
                -{formatCurrency(data.summary.totals.expense, currency, localeCode)}
              </ThemedText>
            </View>
            <View style={[styles.statBlock, styles.statBlockWide, { backgroundColor: colors.border }]}>
              <ThemedText tone="muted" style={styles.statLabel}>{t("stats.transactionList") ?? "Transactions"}</ThemedText>
              <ThemedText style={styles.statValue}>
                {data.summary.local.transactionCount}
              </ThemedText>
            </View>
          </View>
          <View style={styles.balanceRow}>
            <ThemedText tone="muted">{t("stats.netThisMonth") ?? "Net this month"}</ThemedText>
            <ThemedText style={styles.balanceValue}>
              {formatCurrency(data.summary.totals.income - data.summary.totals.expense, currency, localeCode)}
            </ThemedText>
          </View>
        </Card>

        <Card style={styles.section}>
          <View style={styles.cardHeader}>
            <View>
              <ThemedText style={styles.cardTitle}>{t("stats.periodChartTitle") ?? "Income & expense by period"}</ThemedText>
              <ThemedText tone="muted" style={styles.cardSubtitle}>
                {t("stats.periodChartSubtitle") ?? "Compare by day, month, or year"}
              </ThemedText>
            </View>
            <Pressable style={[styles.rangeButton, { borderColor: colors.border }]} onPress={() => openRangePicker("period")}>
              <ThemedText tone="muted" style={styles.rangeButtonText}>{rangeLabel(data.period.range)}</ThemedText>
              <Ionicons name="chevron-down" size={14} color={colors.mutedText} />
            </Pressable>
          </View>
          <View style={styles.modeRow}>
            <Button style={styles.modeButton} title={t("common.day") ?? "Day"} variant={data.period.mode === "day" ? "primary" : "ghost"} onPress={() => data.period.setMode("day")} />
            <Button  style={styles.modeButton} title={t("common.month") ?? "Month"} variant={data.period.mode === "month" ? "primary" : "ghost"} onPress={() => data.period.setMode("month")} />
            <Button style={styles.modeButton} title={t("common.year") ?? "Year"} variant={data.period.mode === "year" ? "primary" : "ghost"} onPress={() => data.period.setMode("year")} />
          </View>
          {data.period.data.length === 0 ? (
            <ThemedText tone="muted">{t("stats.noTrendData") ?? "Not enough data for the chart"}</ThemedText>
          ) : (
            data.period.data.map((item, index) => {
              const incomeWidth = (item.income / Math.max(data.period.domainMax, 1)) * 100;
              const expenseWidth = (item.expense / Math.max(data.period.domainMax, 1)) * 100;
              return (
                <View key={`${item.label}-${index}`} style={styles.chartRow}>
                  <View style={styles.chartLabelRow}>
                    <ThemedText style={styles.chartLabel}>{item.label}</ThemedText>
                  </View>
                  <View style={styles.chartValueRow}>
                    <ThemedText tone="muted" style={styles.chartValueExpense}>
                      -{formatCurrency(item.expense, currency, localeCode)}
                    </ThemedText>
                  </View>
                  <View style={[styles.chartTrack, { backgroundColor: colors.border }]}>
                    <View style={[styles.chartFill, { width: `${expenseWidth}%`, backgroundColor: "#ef4444" }]} />
                  </View>
                  <View style={styles.chartValueRow}>
                    <ThemedText tone="muted" style={styles.chartValueIncome}>
                      +{formatCurrency(item.income, currency, localeCode)}
                    </ThemedText>
                  </View>
                  <View style={[styles.chartTrack, { backgroundColor: colors.border }]}>
                    <View style={[styles.chartFill, { width: `${incomeWidth}%`, backgroundColor: "#22c55e" }]} />
                  </View>
                </View>
              );
            })
          )}
        </Card>

        <Card style={styles.section}>
          <View style={styles.cardHeader}>
            <View>
              <ThemedText style={styles.cardTitle}>{t("stats.categoryChartTitle") ?? "By category"}</ThemedText>
              <ThemedText tone="muted" style={styles.cardSubtitle}>
                {t("stats.rangeLimitHint") ?? "Category distribution"}
              </ThemedText>
            </View>
            <View style={styles.cardHeaderActions}>
              <Pressable style={[styles.rangeButton, { borderColor: colors.border }]} onPress={() => openRangePicker("category")}>
                <ThemedText tone="muted" style={styles.rangeButtonText}>{rangeLabel(data.category.range)}</ThemedText>
                <Ionicons name="chevron-down" size={14} color={colors.mutedText} />
              </Pressable>
              <View style={[styles.chartModeToggle, { backgroundColor: colors.border }]}>
                <Pressable
                  style={[
                    styles.chartModeButton,
                    data.category.chartMode === "pie" && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => data.category.setChartMode("pie")}
                >
                  <Ionicons
                    name="pie-chart"
                    size={16}
                    color={data.category.chartMode === "pie" ? colors.background : colors.mutedText}
                  />
                </Pressable>
                <Pressable
                  style={[
                    styles.chartModeButton,
                    data.category.chartMode === "bar" && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => data.category.setChartMode("bar")}
                >
                  <Ionicons
                    name="bar-chart"
                    size={16}
                    color={data.category.chartMode === "bar" ? colors.background : colors.mutedText}
                  />
                </Pressable>
              </View>
            </View>
          </View>
          {data.category.data.length === 0 ? (
            <ThemedText tone="muted">{t("stats.noData") ?? "No data yet"}</ThemedText>
          ) : data.category.chartMode === "pie" ? (
            <View style={styles.pieTabSection}>
              <View style={[styles.pieTabRow, { backgroundColor: colors.border }]}>
                <Pressable
                  style={[
                    styles.pieTabButton,
                    pieTab === "income" && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setPieTab("income")}
                >
                  <ThemedText style={[styles.pieTabText, pieTab === "income" && styles.pieTabTextActive]}>
                    {t("dashboard.income") ?? "Income"}
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[
                    styles.pieTabButton,
                    pieTab === "expense" && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setPieTab("expense")}
                >
                  <ThemedText style={[styles.pieTabText, pieTab === "expense" && styles.pieTabTextActive]}>
                    {t("dashboard.expense") ?? "Expense"}
                  </ThemedText>
                </Pressable>
              </View>
              <View style={styles.pieChart}>
                {pieTab === "income" ? (
                  data.category.incomePieData.length ? (
                    <PieChart data={data.category.incomePieData.map((item) => ({ value: item.value, color: item.color }))} />
                  ) : (
                    <View style={[styles.piePlaceholder, { borderColor: colors.border }]}>
                      <ThemedText tone="muted">0</ThemedText>
                    </View>
                  )
                ) : data.category.expensePieData.length ? (
                  <PieChart data={data.category.expensePieData.map((item) => ({ value: item.value, color: item.color }))} />
                ) : (
                  <View style={[styles.piePlaceholder, { borderColor: colors.border }]}>
                    <ThemedText tone="muted">0</ThemedText>
                  </View>
                )}
              </View>
              <View style={styles.legendList}>
                {(pieTab === "income" ? data.category.incomePieData : data.category.expensePieData).map((item) => (
                  <View key={item.categoryId} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <ThemedText style={styles.legendLabel}>{item.name}</ThemedText>
                    <ThemedText tone="muted" style={styles.legendValue}>
                      {formatCurrency(item.value, currency, localeCode)}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.categoryBarList}>
              <View pointerEvents="none" style={styles.categoryBarBackdrop}>
                <View style={[styles.categoryBarBackdropSide, styles.categoryBarBackdropExpense]} />
                <View style={styles.categoryBarBackdropGap} />
                <View style={[styles.categoryBarBackdropSide, styles.categoryBarBackdropIncome]} />
              </View>
              {data.category.chartData.map((item) => {
                const expenseValue = Math.max(0, Number(item.expenseLabel ?? 0));
                const incomeValue = Math.max(0, Number(item.incomeLabel ?? 0));
                const expenseWidth = Math.min(100, Math.max(0, (expenseValue / categoryDomainMax) * 100));
                const incomeWidth = Math.min(100, Math.max(0, (incomeValue / categoryDomainMax) * 100));

                return (
                  <View key={item.categoryId} style={styles.categoryBarRow}>
                    <View
                      style={[
                        styles.categoryBarSide,
                        styles.categoryBarExpense,
                      ]}
                    >
                      {expenseValue > 0 ? (
                        <>
                          <ThemedText tone="muted" style={styles.categoryBarValue}>
                            {formatCompactNumber(expenseValue, language)}
                          </ThemedText>
                          <View
                            style={[
                              styles.categoryBarFill,
                              styles.categoryBarFillExpense,
                              { width: `${expenseWidth}%`, backgroundColor: CHART_COLORS.expense },
                            ]}
                          />
                        </>
                      ) : (
                        <View style={styles.categoryBarSpacer} />
                      )}
                    </View>
                    <View style={styles.categoryBarLabel}>
                      <ThemedText
                        tone="muted"
                        style={styles.categoryBarLabelText}
                        numberOfLines={1}
                      >
                        {item.categoryName}
                      </ThemedText>
                    </View>
                    <View
                      style={[
                        styles.categoryBarSide,
                        styles.categoryBarIncome,
                      ]}
                    >
                      {incomeValue > 0 ? (
                        <>
                          <View
                            style={[
                              styles.categoryBarFill,
                              styles.categoryBarFillIncome,
                              { width: `${incomeWidth}%`, backgroundColor: CHART_COLORS.income },
                            ]}
                          />
                          <ThemedText tone="muted" style={styles.categoryBarValue}>
                            {formatCompactNumber(incomeValue, language)}
                          </ThemedText>
                        </>
                      ) : (
                        <View style={styles.categoryBarSpacer} />
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </Card>

        <Card style={styles.section}>
          <View style={styles.cardHeader}>
            <View>
              <ThemedText style={styles.cardTitle}>{t("stats.transactionList") ?? "Transaction List"}</ThemedText>
              <ThemedText tone="muted" style={styles.cardSubtitle}>
                {t("stats.transactionListSubtitle") ?? "Filter and view your transactions"}
              </ThemedText>
            </View>
          </View>
          <View style={styles.filterRow}>
            <Pressable style={[styles.filterButton, { borderColor: colors.border }]} onPress={() => openRangePicker("list")}>
              <ThemedText tone="muted" style={styles.filterButtonText}>{rangeLabel(data.list.range)}</ThemedText>
              <Ionicons name="chevron-down" size={14} color={colors.mutedText} />
            </Pressable>
            <Pressable style={[styles.filterButton, { borderColor: colors.border }]} onPress={() => setCategoryPickerOpen(true)}>
              <ThemedText tone="muted" style={styles.filterButtonText}>{data.list.selectedCategoryLabel}</ThemedText>
              <Ionicons name="chevron-down" size={14} color={colors.mutedText} />
            </Pressable>
          </View>
          <View style={styles.listTotals}>
            <View style={[styles.listTotalItem, { backgroundColor: colors.border }]}>
              <ThemedText tone="muted" style={styles.statLabel}>{t("dashboard.income") ?? "Income"}</ThemedText>
              <ThemedText style={[styles.statValue, styles.incomeValue]}>
                +{formatCurrency(data.list.totals.income, currency, localeCode)}
              </ThemedText>
            </View>
            <View style={[styles.listTotalItem, { backgroundColor: colors.border }]}>
              <ThemedText tone="muted" style={styles.statLabel}>{t("dashboard.expense") ?? "Expense"}</ThemedText>
              <ThemedText style={[styles.statValue, styles.expenseValue]}>
                -{formatCurrency(data.list.totals.expense, currency, localeCode)}
              </ThemedText>
            </View>
          </View>
          {data.list.pagedTransactions.length === 0 ? (
            <ThemedText tone="muted">{t("stats.noTransactions") ?? "No transactions found"}</ThemedText>
          ) : (
            <StatsTransactionList
              transactions={data.list.pagedTransactions}
              onDetail={(item) => setDetailTarget(item)}
              onEdit={(item) => setEditTarget(item)}
              onDelete={(item) => setDeleteTarget(item)}
            />
          )}
          {data.list.totalPages > 1 ? (
            <View style={styles.pagination}>
              <Button
                title={t("common.back") ?? "Back"}
                variant="outline"
                onPress={() => data.list.setPage(Math.max(1, data.list.page - 1))}
                disabled={data.list.page <= 1}
              />
              <ThemedText tone="muted">
                {data.list.page}/{data.list.totalPages}
              </ThemedText>
              <Button
                title={t("common.next") ?? "Next"}
                onPress={() => data.list.setPage(Math.min(data.list.totalPages, data.list.page + 1))}
                disabled={data.list.page >= data.list.totalPages}
              />
            </View>
          ) : null}
        </Card>

        <Card style={styles.section}>
          <View style={styles.cardHeader}>
            <View>
              <ThemedText style={styles.cardTitle}>{t("stats.manageCategories") ?? "Manage categories"}</ThemedText>
              <ThemedText tone="muted" style={styles.cardSubtitle}>
                {t("categories.addHint") ?? "Manage your categories"}
              </ThemedText>
            </View>
            <View style={styles.cardHeaderActions}>
              <Pressable
                style={[styles.expandButton, { borderColor: colors.border }]}
                onPress={() => setCategoryExpanded((prev) => !prev)}
              >
                <Ionicons
                  name={categoryExpanded ? "chevron-up" : "chevron-down"}
                  size={14}
                  color={colors.mutedText}
                />
                <ThemedText tone="muted" style={styles.expandText}>
                  {categoryExpanded ? t("manage.collapse") ?? "Collapse" : t("manage.expand") ?? "Expand"}
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.iconPill, { borderColor: colors.border }]}
                onPress={() => setCategoryCreateOpen(true)}
              >
                <Ionicons name="add" size={16} color={colors.mutedText} />
              </Pressable>
            </View>
          </View>
          <View style={styles.collapseMeasure} pointerEvents="none">
            <View
              onLayout={(event) => {
                const next = event.nativeEvent.layout.height;
                if (next !== categoryContentHeight) setCategoryContentHeight(next);
              }}
            >
              {categories.length === 0 ? (
                <ThemedText tone="muted">{t("stats.noData") ?? "No data yet"}</ThemedText>
              ) : (
                <View style={styles.categoryList}>
                  {categoryItems.map((cat) => (
                    <View key={cat.id} style={[styles.categoryListRow, { borderColor: colors.border }]}>
                      <View style={styles.categoryListInfo}>
                        <CategoryIcon icon={cat.icon || "MoreHorizontal"} color={cat.color || "category-other"} size="sm" />
                        <View style={styles.categoryListText}>
                          <ThemedText style={styles.categoryListTitle}>{cat.name}</ThemedText>
                        </View>
                      </View>
                      <View style={styles.categoryListActions}>
                        <Pressable style={styles.iconButton} onPress={() => setCategoryEditTarget(cat)}>
                          <Ionicons name="create-outline" size={16} color={colors.text} />
                        </Pressable>
                        <Pressable style={styles.iconButton} onPress={() => setCategoryDeleteTarget(cat)}>
                          <Ionicons name="trash-outline" size={16} color={colors.danger} />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}
              {safeCategoryTotalPages > 1 ? (
                <View style={styles.pagination}>
                  <Button
                    title={t("common.back") ?? "Back"}
                    variant="outline"
                    onPress={() => setCategoryPage(Math.max(1, categoryPage - 1))}
                    disabled={categoryPage <= 1}
                  />
                  <ThemedText tone="muted">
                    {categoryPage}/{safeCategoryTotalPages}
                  </ThemedText>
                  <Button
                    title={t("common.next") ?? "Next"}
                    onPress={() => setCategoryPage(Math.min(safeCategoryTotalPages, categoryPage + 1))}
                    disabled={categoryPage >= safeCategoryTotalPages}
                  />
                </View>
              ) : null}
            </View>
          </View>
          <Animated.View
            style={[
              styles.collapseContainer,
              {
                height: categoryAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, categoryContentHeight],
                }),
                opacity: categoryAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              },
            ]}
          >
            {categories.length === 0 ? (
              <ThemedText tone="muted">{t("stats.noData") ?? "No data yet"}</ThemedText>
            ) : (
              <View style={styles.categoryList}>
                {categoryItems.map((cat) => (
                  <View key={cat.id} style={[styles.categoryListRow, { borderColor: colors.border }]}>
                    <View style={styles.categoryListInfo}>
                      <CategoryIcon icon={cat.icon || "MoreHorizontal"} color={cat.color || "category-other"} size="sm" />
                      <View style={styles.categoryListText}>
                        <ThemedText style={styles.categoryListTitle}>{cat.name}</ThemedText>
                      </View>
                    </View>
                    <View style={styles.categoryListActions}>
                      <Pressable style={styles.iconButton} onPress={() => setCategoryEditTarget(cat)}>
                        <Ionicons name="create-outline" size={16} color={colors.text} />
                      </Pressable>
                      <Pressable style={styles.iconButton} onPress={() => setCategoryDeleteTarget(cat)}>
                        <Ionicons name="trash-outline" size={16} color={colors.danger} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
            {safeCategoryTotalPages > 1 ? (
              <View style={styles.pagination}>
                <Button
                  title={t("common.back") ?? "Back"}
                  variant="outline"
                  onPress={() => setCategoryPage(Math.max(1, categoryPage - 1))}
                  disabled={categoryPage <= 1}
                />
                <ThemedText tone="muted">
                  {categoryPage}/{safeCategoryTotalPages}
                </ThemedText>
                <Button
                  title={t("common.next") ?? "Next"}
                  onPress={() => setCategoryPage(Math.min(safeCategoryTotalPages, categoryPage + 1))}
                  disabled={categoryPage >= safeCategoryTotalPages}
                />
              </View>
            ) : null}
          </Animated.View>
        </Card>

        <EditTransactionModal
          visible={Boolean(editTarget)}
          transaction={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEditSave}
        />
        <TransactionDetailModal
          visible={Boolean(detailTarget)}
          transaction={detailTarget}
          onClose={() => setDetailTarget(null)}
        />
        <Modal visible={Boolean(deleteTarget)} transparent animationType="fade" onRequestClose={() => setDeleteTarget(null)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setDeleteTarget(null)}>
            <Pressable style={[styles.modalCard, { backgroundColor: colors.card }]} onPress={() => undefined}>
              <ThemedText style={styles.modalTitle}>{t("transactions.deleteTitle") ?? "Delete transaction?"}</ThemedText>
              <ThemedText tone="muted">{t("transactions.deleteMessage") ?? "This action cannot be undone."}</ThemedText>
              <View style={styles.modalActions}>
                <Button title={t("common.cancel") ?? "Cancel"} variant="outline" onPress={() => setDeleteTarget(null)} />
                <Button
                  title={t("common.delete") ?? "Delete"}
                  onPress={() => {
                    if (deleteTarget) {
                      transactionStore.remove(deleteTarget.id);
                    }
                    setDeleteTarget(null);
                  }}
                />
              </View>
            </Pressable>
          </Pressable>
        </Modal>
        <CategoryModal visible={categoryCreateOpen} onClose={() => setCategoryCreateOpen(false)} onSubmit={handleCreateCategory} />
        <CategoryModal
          visible={Boolean(categoryEditTarget)}
          initial={categoryEditTarget}
          onClose={() => setCategoryEditTarget(null)}
          onSubmit={handleEditCategory}
        />
        <Modal visible={Boolean(categoryDeleteTarget)} transparent animationType="fade" onRequestClose={() => setCategoryDeleteTarget(null)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setCategoryDeleteTarget(null)}>
            <Pressable style={[styles.modalCard, { backgroundColor: colors.card }]} onPress={() => undefined}>
              <ThemedText style={styles.modalTitle}>{t("categories.deleteTitle") ?? "Delete category?"}</ThemedText>
              <ThemedText tone="muted">{t("categories.deleteMessage") ?? "This action cannot be undone."}</ThemedText>
              <View style={styles.modalActions}>
                <Button title={t("common.cancel") ?? "Cancel"} variant="outline" onPress={() => setCategoryDeleteTarget(null)} />
                <Button
                  title={t("common.delete") ?? "Delete"}
                  onPress={() => {
                    if (categoryDeleteTarget) {
                      categoryStore.remove(categoryDeleteTarget.id);
                    }
                    setCategoryDeleteTarget(null);
                  }}
                />
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </ScrollView>

      <Modal visible={Boolean(rangeTarget)} transparent animationType="fade" onRequestClose={closeRangePicker}>
        <Pressable style={styles.modalBackdrop} onPress={closeRangePicker}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card }]} onPress={() => undefined}>
            <ThemedText style={styles.modalTitle}>{t("stats.rangeFilterTitle") ?? "Select range"}</ThemedText>
            {rangePresets.map((item) => (
              <Pressable key={item.key} style={styles.modalOption} onPress={() => applyRange(item.range)}>
                <ThemedText>{item.label}</ThemedText>
              </Pressable>
            ))}
            <Button title={t("common.close") ?? "Close"} variant="outline" onPress={closeRangePicker} />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={categoryPickerOpen} transparent animationType="fade" onRequestClose={() => setCategoryPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setCategoryPickerOpen(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card }]} onPress={() => undefined}>
            <ThemedText style={styles.modalTitle}>{t("stats.categorySearch") ?? "Filter categories"}</ThemedText>
            <FlatList
              contentInsetAdjustmentBehavior="automatic"
              style={styles.modalList}
              data={data.list.categoryOptions}
              extraData={data.list.selectedCategoryIds}
              keyExtractor={(item) => item.id}
              renderItem={renderCategoryPickerItem}
              showsVerticalScrollIndicator={false}
            />
            <Button title={t("common.close") ?? "Close"} variant="outline" onPress={() => setCategoryPickerOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 160,
  },
  header: {
    marginBottom: 20,
    gap: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  section: {
    marginBottom: 16,
  },
  cardHeader: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  cardHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: "auto",
  },
  collapseContainer: {
    overflow: "hidden",
  },
  collapseMeasure: {
    position: "absolute",
    opacity: 0,
    left: 0,
    right: 0,
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  expandText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  cardSubtitle: {
    marginTop: 6,
    fontSize: 12,
  },
  modeRow: {
    flexDirection: "row",
    backgroundColor: "#ffff0010",
    borderRadius: 16,
    width: "auto",
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statBlock: {
    flexGrow: 1,
    flexBasis: "48%",
    minWidth: "48%",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statBlockWide: {
    flexBasis: "100%",
    minWidth: "100%",
  },
  statLabel: {
    fontSize: 12,
  },
  incomeValue: {
    color: "#16a34a",
  },
  expenseValue: {
    color: "#dc2626",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 6,
  },
  balanceRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceValue: {
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  chartRow: {
    marginTop: 14,
    gap: 8,
  },
  chartLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  chartValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  chartValueExpense: {
    fontSize: 12,
    color: "#dc2626",
  },
  chartValueIncome: {
    fontSize: 12,
    color: "#16a34a",
  },
  chartLabel: {
    fontSize: 12,
  },
  chartTrack: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
  },
  chartFill: {
    height: "100%",
    borderRadius: 999,
  },
  categoryBarList: {
    marginTop: 12,
    gap: CATEGORY_BAR_GAP,
    paddingVertical: 6,
    position: "relative",
  },
  categoryBarBackdrop: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    alignItems: "stretch",
    zIndex: 0,
  },
  categoryBarBackdropSide: {
    flex: 1,
    borderRadius: 12,
  },
  categoryBarBackdropExpense: {
    backgroundColor: "rgba(239,68,68,0.08)",
  },
  categoryBarBackdropIncome: {
    backgroundColor: "rgba(34,197,94,0.08)",
  },
  categoryBarBackdropGap: {
    width: CATEGORY_BAR_GAP_TOTAL,
  },
  categoryBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: CATEGORY_BAR_GAP,
    zIndex: 1,
  },
  categoryBarSide: {
    flex: 1,
    minHeight: 24,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  categoryBarExpense: {
    justifyContent: "flex-end",
  },
  categoryBarIncome: {
    justifyContent: "flex-start",
  },
  categoryBarLabel: {
    width: CATEGORY_BAR_LABEL_WIDTH,
    flexShrink: 0,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryBarLabelText: {
    fontSize: 11,
    fontWeight: "600",
  },
  categoryBarValue: {
    fontSize: 11,
  },
  categoryBarFill: {
    height: 14,
  },
  categoryBarFillExpense: {
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  categoryBarFillIncome: {
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  categoryBarSpacer: {
    height: 14,
  },
  iconButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  rangeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  rangePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(148,163,184,0.18)",
  },
  rangeButtonText: {
    fontSize: 12,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  filterButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 12,
  },
  iconPill: {
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chartModeToggle: {
    flexDirection: "row",
    alignItems: "center",
    padding: 3,
    borderRadius: 999,
  },
  chartModeButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  listTotals: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  listTotalItem: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 12,
  },
  pieTabSection: {
    gap: 12,
    alignItems: "center",
  },
  pieTabRow: {
    flexDirection: "row",
    borderRadius: 999,
    padding: 4,
    width: "100%",
  },
  pieTabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 999,
  },
  pieTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
  },
  pieTabTextActive: {
    color: "#fff",
  },
  pieChart: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  legendList: {
    width: "100%",
    gap: 10,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  legendValue: {
    fontSize: 12,
  },
  piePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    padding: 18,
    gap: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  categoryList: {
    gap: 10,
  },
  categoryListRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryListInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  categoryListText: {
    flex: 1,
  },
  categoryListTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  categoryListActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modalList: {
    maxHeight: 320,
  },
});
