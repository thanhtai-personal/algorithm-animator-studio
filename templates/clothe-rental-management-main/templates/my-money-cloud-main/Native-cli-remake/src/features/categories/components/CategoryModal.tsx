import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, FlatList, Modal, PanResponder, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/themeProvider";
import { useToast } from "@/hooks/use-toast";
import { categoryStore } from "@/store/categoryStore";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { CUSTOM_CATEGORY_ICON, CUSTOM_CATEGORY_COLOR, getAllCategoryIconOptions } from "@/features/categories/constants";
import type { CategoryInput, CategoryRow } from "@/features/categories/types";

type Props = {
  visible: boolean;
  initial?: CategoryRow | null;
  onClose: () => void;
  onSubmit: (input: CategoryInput) => void;
};

const ICON_COLUMN_COUNT = 5;

export function CategoryModal({ visible, initial, onClose, onSubmit }: Props) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { toast } = useToast();
  const iconOptions = useMemo(() => getAllCategoryIconOptions(), []);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(CUSTOM_CATEGORY_ICON);
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const sheetScrollY = useRef(0);

  useEffect(() => {
    if (visible) {
      const fallback = iconOptions[0]?.icon ?? CUSTOM_CATEGORY_ICON;
      setName(initial?.name ?? "");
      setIcon(initial?.icon ?? fallback);
    }
  }, [visible, initial, iconOptions]);

  useEffect(() => {
    if (!visible) {
      sheetTranslateY.setValue(0);
    }
  }, [visible, sheetTranslateY]);

  useEffect(() => {
    if (!iconOptions.some((option) => option.icon === icon)) {
      const fallback = iconOptions[0]?.icon ?? CUSTOM_CATEGORY_ICON;
      setIcon(fallback);
    }
  }, [icon, iconOptions]);

  const selectedIconColor =
    iconOptions.find((option) => option.icon === icon)?.color ?? CUSTOM_CATEGORY_COLOR;
  const renderIconOption = useCallback(
    ({ item: option }: { item: (typeof iconOptions)[number] }) => {
      const active = option.icon === icon;
      return (
        <Pressable
          onPress={() => setIcon(option.icon)}
          style={[
            styles.iconOption,
            { borderColor: active ? colors.primary : colors.border },
            active && { backgroundColor: colors.background },
          ]}
        >
          <CategoryIcon icon={option.icon} color={option.color} size="md" />
        </Pressable>
      );
    },
    [colors.background, colors.border, colors.primary, icon]
  );

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error(t("categories.nameRequired") ?? "Name is required");
      return;
    }
    const normalizedName = trimmed.toLowerCase();
    const isDuplicate = categoryStore.categories.some((category) => {
      if (initial?.id && category.id === initial.id) return false;
      return category.name.toLowerCase() === normalizedName;
    });
    if (isDuplicate) {
      toast.error(t("categories.duplicateName") ?? "Category name already exists");
      return;
    }
    onSubmit({
      name: trimmed,
      icon,
      color: selectedIconColor,
    });
  };

  const sheetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          sheetScrollY.current <= 0 &&
          gesture.dy > 6 &&
          Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_, gesture) => {
          if (gesture.dy > 0) {
            sheetTranslateY.setValue(gesture.dy);
          }
        },
        onPanResponderRelease: (_, gesture) => {
          const shouldClose = gesture.dy > 120 || gesture.vy > 1.1;
          if (shouldClose) {
            Animated.timing(sheetTranslateY, {
              toValue: 320,
              duration: 180,
              useNativeDriver: true,
            }).start(() => {
              sheetTranslateY.setValue(0);
              onClose();
            });
          } else {
            Animated.spring(sheetTranslateY, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(sheetTranslateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [onClose, sheetTranslateY]
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: colors.card, transform: [{ translateY: sheetTranslateY }] },
          ]}
          {...sheetPanResponder.panHandlers}
          onStartShouldSetResponder={() => true}
        >
          <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
            <View />
            <ThemedText style={styles.sheetTitle}>
              {initial ? t("categories.addTitle") ?? "Edit category" : t("categories.addAction") ?? "Add category"}
            </ThemedText>
            <Pressable style={[styles.closeButton, { borderColor: colors.border }]} onPress={onClose}>
              <Ionicons name="close" size={16} color={colors.mutedText} />
            </Pressable>
          </View>
          <FlatList
            contentInsetAdjustmentBehavior="automatic"
            style={styles.sheetBody}
            contentContainerStyle={styles.sheetBodyContent}
            data={iconOptions}
            keyExtractor={(option) => option.icon}
            renderItem={renderIconOption}
            numColumns={ICON_COLUMN_COUNT}
            columnWrapperStyle={styles.iconGridRow}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(event) => {
              sheetScrollY.current = event.nativeEvent.contentOffset.y;
            }}
            ListHeaderComponent={
              <View style={styles.sheetListHeader}>
                <View style={styles.section}>
                  <ThemedText tone="muted">{t("categories.namePlaceholder") ?? "Name"}</ThemedText>
                  <TextField
                    value={name}
                    onChangeText={setName}
                    placeholder={t("categories.namePlaceholder") ?? "e.g. Breakfast"}
                    style={styles.field}
                  />
                </View>
                <View style={styles.section}>
                  <ThemedText tone="muted">{t("categories.iconLabel") ?? "Select an icon"}</ThemedText>
                </View>
              </View>
            }
          />
          <View style={[styles.sheetFooter, { borderTopColor: colors.border }]}>
            <View style={styles.footerActions}>
              <Button title={t("common.cancel") ?? "Cancel"} variant="outline" onPress={onClose} />
              <Button title={t("common.done") ?? "Done"} onPress={handleSave} />
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    overflow: "hidden",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  closeButton: {
    borderWidth: 1,
    borderRadius: 999,
    padding: 6,
  },
  sheetBody: {
    flexGrow: 0,
  },
  sheetBodyContent: {
    padding: 16,
    gap: 14,
  },
  section: {
    gap: 8,
  },
  field: {
    marginTop: 4,
  },
  sheetListHeader: {
    gap: 14,
  },
  iconGridRow: {
    justifyContent: "center",
    gap: 10,
  },
  iconOption: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    marginHorizontal: 0,
  },
  sheetFooter: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    justifyContent: "flex-end",
  },
  footerActions: {
    flexDirection: "row",
    gap: 12,
  },
});
