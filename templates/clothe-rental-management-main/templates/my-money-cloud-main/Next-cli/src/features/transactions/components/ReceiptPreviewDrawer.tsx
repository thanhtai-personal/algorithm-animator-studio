"use client";

import React, { useState } from "react";
import { Drawer, DrawerClose, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash, Edit2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { formatCurrency } from "@/lib/currency";
import { Card } from "@/components/ui/card";

type ParsedItem = {
  id: string;
  description: string;
  amount: number | null;
  type: "income" | "expense";
  categoryId: string | null;
  notes?: string;
};

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense";
}

interface ReceiptPreviewDrawerProps {
  open: boolean;
  items: ParsedItem[];
  onClose: () => void;
  onChangeItem: (id: string, patch: Partial<ParsedItem>) => void;
  onDelete: (id: string) => void;
  onSubmit: (items: ParsedItem[]) => Promise<boolean> | void;
  processing?: boolean;
  categories?: Category[];
}

export function ReceiptPreviewDrawer({
  open,
  items,
  onClose,
  onChangeItem,
  onDelete,
  onSubmit,
  processing = false,
  categories = [],
}: ReceiptPreviewDrawerProps) {
  const { t, localeCode, currency } = useI18n();
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Get invoice category (danh mục hóa đơn)
  const invoiceCategory = categories.find((c) => c.name?.toLowerCase().includes("hóa đơn") || c.name?.toLowerCase().includes("invoice"));

  const handleEditClick = (id: string) => {
    setEditingId(id);
  };

  const handleSaveEdit = (id: string) => {
    setEditingId(null);
  };

  const handleSubmit = async () => {
    // Assign invoice category to items that don't have one
    const itemsWithCategory = items.map((item) => ({
      ...item,
      categoryId: item.categoryId || invoiceCategory?.id || null,
    }));
    
    const res = await onSubmit(itemsWithCategory);
    if (res !== false) {
      onClose();
    }
  };

  return (
    <Drawer open={open} onOpenChange={(val) => !val && onClose()}>
      <DrawerContent className="w-full max-h-[80vh] p-0 overflow-hidden rounded-t-3xl flex flex-col min-h-0">
        <div className="p-6 flex-1 overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">{t("addTransaction.reviewReceipt")}</h3>
            <DrawerClose asChild>
              <Button variant="ghost" disabled={processing}>
                ✕
              </Button>
            </DrawerClose>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <Card
                key={item.id}
                className={`p-4 transition-colors ${
                  item.type === "expense"
                    ? "bg-red-50 border-red-200"
                    : "bg-green-50 border-green-200"
                }`}
              >
                {editingId === item.id ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">{t("common.description")}</label>
                      <Input
                        value={item.description}
                        onChange={(e) => onChangeItem(item.id, { description: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-600">{t("common.amount")}</label>
                      <Input
                        value={item.amount == null ? "" : String(item.amount)}
                        onChange={(e) => {
                          const n = Number(e.target.value.replace(/[^0-9.\-]/g, ""));
                          onChangeItem(item.id, { amount: Number.isFinite(n) ? n : null });
                        }}
                        type="number"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-600">{t("common.category")}</label>
                      <Select
                        value={item.categoryId || ""}
                        onValueChange={(categoryId) => {
                          onChangeItem(item.id, { categoryId: categoryId || null });
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={t("common.selectCategory")} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories
                            .filter((c) => c.type === item.type)
                            .map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                <span className="mr-2">{cat.icon}</span>
                                {cat.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-600">{t("common.notes")}</label>
                      <Input
                        value={item.notes || ""}
                        onChange={(e) => onChangeItem(item.id, { notes: e.target.value })}
                        placeholder={t("common.notes")}
                        className="mt-1"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId(null)}
                      >
                        {t("common.cancel")}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(item.id)}
                      >
                        {t("common.save")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode - Display like transaction list
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{item.description}</p>
                      {item.notes && item.notes !== item.description && (
                        <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {categories.find((c) => c.id === item.categoryId)?.name || invoiceCategory?.name || t("categories.other")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className={`font-bold text-lg ${item.type === "expense" ? "text-red-600" : "text-green-600"}`}>
                          {item.type === "expense" ? "-" : "+"}{formatCurrency(item.amount || 0, currency, localeCode)}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(item.id)}
                        disabled={processing}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(item.id)}
                        disabled={processing}
                      >
                        <Trash className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
            <Button variant="outline" onClick={onClose} disabled={processing}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={processing || items.length === 0}
            >
              {processing ? t("common.processing") : t("common.save")}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
