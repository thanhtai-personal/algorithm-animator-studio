import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Edit, Plus, Trash2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useCreateCategoryMutation } from "@/features/categories/queries/useCreateCategoryMutation";
import { useDeleteCategoryMutation } from "@/features/categories/queries/useDeleteCategoryMutation";
import { useUpdateCategoryMutation } from "@/features/categories/queries/useUpdateCategoryMutation";
import { getAllCategoryIconOptions, CUSTOM_CATEGORY_ICON, CUSTOM_CATEGORY_COLOR } from "@/features/categories/constants";
import type { CategoryInput } from "@/features/categories/types";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { toast } from "sonner";
import { cn } from "@/utils";
import { useEffect } from "react";
import { categoryStore } from "@/store/categoryStore";
import { PAGE_SIZE } from "../constants";
import { observer } from "mobx-react-lite";


export const CategoryManager = observer(function CategoryManager() {
  const { t } = useI18n();
  const categories = categoryStore.categories;
  const createMutation = useCreateCategoryMutation();
  const deleteMutation = useDeleteCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();

  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [form, setForm] = useState<{ name: string; icon: string }>({
    name: "",
    icon: CUSTOM_CATEGORY_ICON,
  });
  const [open, setOpen] = useState(false);

  const sortedCategories = categories
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

  const iconOptions = useMemo(() => getAllCategoryIconOptions(), []);
  const selectedIconColor =
    iconOptions.find((option) => option.icon === form.icon)?.color ?? CUSTOM_CATEGORY_COLOR;

  useEffect(() => {
    if (!iconOptions.some((option) => option.icon === form.icon)) {
      const next = iconOptions[0]?.icon ?? CUSTOM_CATEGORY_ICON;
      setForm((prev) => ({ ...prev, icon: next }));
    }
  }, [iconOptions, form.icon]);

  const totalPages = Math.max(1, Math.ceil(sortedCategories.length / PAGE_SIZE));
  const pageItems = sortedCategories.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetForm = () => {
    const first = iconOptions[0];
    setForm({ name: "", icon: first?.icon ?? CUSTOM_CATEGORY_ICON });
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (id: string, name: string, icon?: string | null) => {
    setEditingId(id);
    const first = iconOptions[0];
    setForm({ name, icon: icon ?? first?.icon ?? CUSTOM_CATEGORY_ICON });
    setOpen(true);
  };

  const handleSubmit = async () => {
    const name = form.name.trim();
    if (!name) {
      toast.error(t("categories.nameRequired"));
      return;
    }
    
    // Check for duplicate category name (case-insensitive)
    const normalizedName = name.toLowerCase();
    const isDuplicate = categories.some((category: any) => {
      // Skip the current category when editing
      if (editingId && category.id === editingId) return false;
      return category.name.toLowerCase() === normalizedName;
    });
    
    if (isDuplicate) {
      toast.error(t("categories.duplicateName") || "Tên danh mục đã tồn tại");
      return;
    }
    
    const payload: CategoryInput = {
      id: editingId ?? undefined,
      name,
      icon: form.icon,
      color: selectedIconColor,
    };
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, input: payload });
        toast.success(t("toast.transactionUpdated"));
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(t("categories.createSuccess"));
      }
      setOpen(false);
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("categories.createFailed");
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(null);
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(t("categories.deleteSuccess"));
    } catch (error) {
      const message = error instanceof Error ? error.message : t("categories.deleteFailed");
      toast.error(message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-1 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
            aria-expanded={expanded}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {expanded ? t("manage.collapse") : t("manage.expand")}
          </button>
          <Button
            size="icon"
            onClick={openCreate}
            aria-label={t("categories.addAction")}
            title={t("categories.addAction")}
            className="h-6 w-6"
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">{t("categories.addAction")}</span>
          </Button>
        </div>
      </div>

      {expanded ? (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            {pageItems.map((category: any) => {
              return (
                <div
                  key={category.id}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-3 py-2",
                    category.isDefault ? "bg-muted/30 border-muted" : "bg-card"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CategoryIcon icon={category.icon} color={category.color} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{category.name}</p>
                      {category.isDefault && (
                        <p className="text-xs text-muted-foreground">{t("categories.default")}</p>
                      )}
                    </div>
                  </div>
                  {!category.isDefault && (
                    <div className="flex items-center gap-2">
                      <button
                        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                        onClick={() => openEdit(category.id, category.name, category.icon)}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className="flex h-6 w-6 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
                        onClick={() => setConfirmDeleteId(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("stats.noData")}</p>
          ) : (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {t("common.page", { current: page, total: totalPages })}
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  {t("common.previous")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  {t("common.next")}
                </Button>
              </div>
            </div>
          )}
        </>
      ) : null}

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="w-full max-h-[80vh] p-0 overflow-hidden rounded-t-3xl flex flex-col">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-border/60 px-5 py-4">
            <div />
            <div className="text-center">
              <DrawerTitle className="text-base">
                {editingId ? t("categories.addTitle") : t("categories.addAction")}
              </DrawerTitle>
            </div>
            <div className="justify-self-end">
              <DrawerClose asChild>
                <button className="rounded-full border border-border/60 p-2 text-muted-foreground transition hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </DrawerClose>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            <div className="space-y-1">
              <Label>{t("categories.namePlaceholder")}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={t("categories.namePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("categories.iconLabel")}</Label>
              <div className="flex flex-wrap gap-3">
                {iconOptions.map((option) => {
                  const active = option.icon === form.icon;
                  return (
                    <button
                      key={option.icon}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, icon: option.icon }))}
                      className={cn(
                        "rounded-2xl border px-2 py-2",
                        active ? "border-primary ring-2 ring-primary/40" : "border-border/70"
                      )}
                    >
                      <CategoryIcon icon={option.icon} color={option.color} size="md" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DrawerFooter className="pt-0 px-5 pb-5">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1"
              >
                {t("common.done")}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={Boolean(confirmDeleteId)} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("categories.deleteTitle")}</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}>
              {t("categories.deleteAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
})
