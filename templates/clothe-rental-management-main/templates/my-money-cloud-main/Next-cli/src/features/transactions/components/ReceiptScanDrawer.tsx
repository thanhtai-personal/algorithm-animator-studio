"use client";

import React, { useRef, useState } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash, Camera, Edit2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils";
import { formatCurrency } from "@/lib/currency";
import { ParsedItem } from "../types";
import { parseReceiptTextToItems } from "../utils";

interface ReceiptScanDrawerProps {
  open: boolean;
  onClose: () => void;
  categories?: { id: string; name?: string }[];
  onSubmit: (items: ParsedItem[]) => Promise<boolean> | void;
  initialMode?: "camera" | "upload" | null;
}

export function ReceiptScanDrawer({ open, onClose, categories = [], onSubmit, initialMode }: ReceiptScanDrawerProps) {
  const { t, currency, localeCode } = useI18n();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [processing, setProcessing] = useState(false);
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Auto-trigger the appropriate action when drawer opens with initialMode
  React.useEffect(() => {
    if (open && initialMode && fileRef.current) {
      setTimeout(() => {
        if (initialMode === "camera") {
          handleCapture();
        } else if (initialMode === "upload") {
          handleUpload();
        }
      }, 100);
    }
  }, [open, initialMode]);

  const handleCapture = () => {
    // Trigger camera capture on mobile/devices
    if (fileRef.current) {
      fileRef.current.setAttribute('capture', 'environment');
      fileRef.current.click();
    }
  };

  const handleUpload = () => {
    if (fileRef.current) {
      fileRef.current.removeAttribute('capture');
      fileRef.current.click();
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    try {
      const img = await file.arrayBuffer();
      // dynamic import tesseract to avoid SSR issues
      const { createWorker } = await import("tesseract.js");
      const worker: any = await createWorker();
      await worker.load();
      await worker.loadLanguage("eng");
      await worker.initialize("eng");
      const { data } = await worker.recognize(new Blob([img]));
      await worker.terminate();
      const parsed = parseReceiptTextToItems(data.text || "");
      if (parsed.length === 0) {
        toast.error(t("toast.noItemsDetected") || "No items detected");
      }
      setItems(parsed);
    } catch (err) {
      console.error(err);
      toast.error(t("toast.ocrFailed") || "Failed to parse image");
    } finally {
      setProcessing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleChangeItem = (id: string, patch: Partial<ParsedItem>) => {
    setItems((s) => s.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const handleDelete = (id: string) => setItems((s) => s.filter((it) => it.id !== id));

  const handleSubmit = async () => {
    if (!items.length) {
      toast.error(t("toast.noItemsToSubmit") || "No items to submit");
      return;
    }
    try {
      setProcessing(true);
      const res = await onSubmit(items);
      if (res === false) {
        // parent indicated failure
        return;
      }
      toast.success(t("toast.addedMultiple") || "Added transactions");
      setItems([]);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(t("toast.saveFailed") || "Save failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={(val) => !val && onClose()}>
      <DrawerContent className="w-full max-h-[80vh] p-0 overflow-hidden rounded-t-3xl flex flex-col min-h-0">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">{t("addTransaction.scanReceipt")}</h3>
            <div className="flex gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
              />
              <Button variant="outline" onClick={handleCapture} disabled={processing}>
                <Camera className="mr-2 h-4 w-4" /> {t("addTransaction.capture")}
              </Button>
              <Button variant="outline" onClick={handleUpload} disabled={processing}>
                {t("addTransaction.upload")}
              </Button>
              <Button onClick={onClose} variant="ghost" disabled={processing}>
                {t("common.close")}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {processing && <div className="text-sm text-muted-foreground">{t("common.processing")}</div>}

            {items.length === 0 && !processing && (
              <div className="text-sm text-muted-foreground">{t("addTransaction.scanHint") || "Chụp hóa đơn để quét các mục"}</div>
            )}

            <div className="space-y-3">
              {items.map((it) => {
                const categoryName =
                  categories.find((c) => c.id === it.categoryId)?.name ?? t("categories.other");
                const isEditing = editingId === it.id;

                return (
                  <Card
                    key={it.id}
                    className={cn(
                      "p-4 rounded-2xl border transition-colors",
                      it.type === "expense"
                        ? "bg-rose-50 border-rose-200"
                        : "bg-emerald-50 border-emerald-200"
                    )}
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <Input
                          value={it.description}
                          onChange={(e) => handleChangeItem(it.id, { description: e.target.value })}
                          placeholder={t("common.description")}
                        />
                        <Input
                          value={it.amount == null ? "" : String(it.amount)}
                          onChange={(e) => {
                            const n = Number(e.target.value.replace(/[^0-9.\-]/g, ""));
                            handleChangeItem(it.id, { amount: Number.isFinite(n) ? n : null });
                          }}
                          placeholder={t("common.amount")}
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                            {t("common.cancel")}
                          </Button>
                          <Button size="sm" onClick={() => setEditingId(null)}>
                            {t("common.save")}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{it.description}</p>
                          {it.notes && it.notes !== it.description ? (
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{it.notes}</p>
                          ) : null}
                          <p className="text-xs text-muted-foreground mt-2">{categoryName}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <p
                            className={cn(
                              "text-sm font-semibold",
                              it.type === "expense" ? "text-rose-500" : "text-emerald-600"
                            )}
                          >
                            {it.type === "expense" ? "-" : "+"}
                            {formatCurrency(it.amount || 0, currency, localeCode)}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => setEditingId(it.id)}
                              disabled={processing}
                              className="h-7 w-7"
                              aria-label={t("transactions.editTitle")}
                              title={t("transactions.editTitle")}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() => handleDelete(it.id)}
                              disabled={processing}
                              className="h-7 w-7"
                              aria-label={t("transactions.deleteAction")}
                              title={t("transactions.deleteAction")}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setItems([])} disabled={processing || items.length === 0}>
                {t("common.clear")}
              </Button>
              <Button onClick={handleSubmit} disabled={processing || items.length === 0}>
                {t("common.submit")}
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
