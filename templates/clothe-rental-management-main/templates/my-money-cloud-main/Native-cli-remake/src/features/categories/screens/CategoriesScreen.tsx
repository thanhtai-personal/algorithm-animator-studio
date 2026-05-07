import { Alert, FlatList, StyleSheet, View } from "react-native";
import { observer } from "mobx-react-lite";
import { useCallback, useState } from "react";

import { ScreenView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { categoryStore } from "@/store/categoryStore";
import { CategoryModal } from "@/features/categories/components/CategoryModal";
import type { CategoryRow, CategoryInput } from "@/features/categories/types";

export const CategoriesScreen = observer(function CategoriesScreen() {
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<CategoryRow | null>(null);

  const handleCreate = (input: CategoryInput) => {
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
    setShowCreate(false);
  };

  const handleEdit = (input: CategoryInput) => {
    if (!editTarget) return;
    categoryStore.upsert({
      ...editTarget,
      name: input.name,
      icon: input.icon ?? null,
      color: input.color ?? null,
    });
    setEditTarget(null);
  };
  const handleDelete = useCallback((item: CategoryRow) => {
    Alert.alert("Delete category?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => categoryStore.remove(item.id) },
    ]);
  }, []);
  const renderCategoryItem = useCallback(
    ({ item }: { item: CategoryRow }) => (
      <Card>
        <View style={styles.rowText}>
          <ThemedText style={styles.rowTitle}>{item.name}</ThemedText>
          <ThemedText tone="muted" style={styles.rowSubtitle}>
            {item.icon ?? "-"} {item.color ?? ""}
          </ThemedText>
        </View>
        <View style={styles.rowActions}>
          <Button title="Edit" variant="ghost" onPress={() => setEditTarget(item)} />
          <Button title="Delete" variant="ghost" onPress={() => handleDelete(item)} />
        </View>
      </Card>
    ),
    [handleDelete]
  );

  return (
    <ScreenView style={styles.container}>
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={categoryStore.categories}
        keyExtractor={(item) => item.id}
        renderItem={renderCategoryItem}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.header}>
              <ThemedText style={styles.title}>Categories</ThemedText>
              <ThemedText tone="muted">Manage your categories</ThemedText>
            </View>
            <Card>
              <Button title="Add category" onPress={() => setShowCreate(true)} />
            </Card>
          </View>
        }
        ListEmptyComponent={
          <Card>
            <ThemedText tone="muted">No categories</ThemedText>
          </Card>
        }
      />
      <CategoryModal visible={showCreate} onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
      <CategoryModal
        visible={Boolean(editTarget)}
        initial={editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEdit}
      />
    </ScreenView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 140,
  },
  listHeader: {
    gap: 12,
  },
  header: {
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  row: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  rowText: {
    marginBottom: 6,
  },
  rowActions: {
    flexDirection: "row",
    gap: 8,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  rowSubtitle: {
    fontSize: 12,
  },
});
