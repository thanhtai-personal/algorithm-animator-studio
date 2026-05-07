import { useState, useRef } from "react";
import { toast } from "sonner";
import Tesseract from "tesseract.js";
import { categoryStore } from "@/store/categoryStore";

type ParsedItem = {
  id: string;
  description: string; // Product name
  amount: number | null;
  type: "income" | "expense";
  categoryId: string | null;
  notes?: string; // Product name as notes
};

function parseReceiptTextToItems(text: string): ParsedItem[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items: ParsedItem[] = [];
  
  for (const line of lines) {
    // Match numbers anywhere in the line
    // Handles: "Item Name 100,000", "100.000 vnd item", "item - 50k"
    const m = line.match(/([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?|[0-9]{2,}(?:[.,][0-9]{1,2})?)\s*(?:vnd|đ|d|usd|€|\$|k|K)?/i);
    
    if (m && m[0]) {
      const raw = m[1];
      const normalized = raw.replace(/[.,](?=\d{3})/g, "").replace(/,/g, ".");
      const amount = Number(normalized);
      
      // Product name = full line with amount removed
      const productName = line.replace(m[0], "").trim() || "Item";
      
      if (amount > 0 && Number.isFinite(amount)) {
        items.push({
          id: Math.random().toString(36).slice(2, 9),
          description: productName,
          amount,
          type: "expense", // Mặc định chi tiêu
          categoryId: null, // Sẽ được set khi chọn danh mục
          notes: productName, // Lưu tên sản phẩm vào notes
        });
      }
    }
  }
  return items;
}

export function useReceiptScanner() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [processing, setProcessing] = useState(false);
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setProcessing(true);
    let worker: any = null;
    
    try {
      const img = await file.arrayBuffer();
      if (img.byteLength === 0) {
        toast.error("Tệp hình ảnh trống");
        return;
      }

      // Use Tesseract v4+ API correctly
      const result = await Tesseract.recognize(
        new Blob([img], { type: file.type }),
        "eng",
        {
          logger: (m: any) => {
            console.log("OCR Progress:", m.progress);
          },
        }
      );
      
      const text = result.data.text?.trim() || "";
      if (!text) {
        toast.error("Không thể nhận dạng văn bản từ hình ảnh");
        return;
      }

      const parsed = parseReceiptTextToItems(text);
      if (parsed.length === 0) {
        toast.warning("Không tìm thấy mục nào trên hóa đơn");
      } else {
        setItems(parsed);
        setShowPreview(true);
        toast.success(`Đã tìm thấy ${parsed.length} mục`);
      }
    } catch (err) {
      console.error("OCR Error:", err);
      const errorMsg = err instanceof Error ? err.message : "Lỗi không xác định";
      toast.error(`Không thể đọc hóa đơn: ${errorMsg}`);
    } finally {
      setProcessing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleCapture = () => {
    if (fileRef.current) {
      fileRef.current.setAttribute("capture", "environment");
      fileRef.current.click();
    }
  };

  const handleUpload = () => {
    if (fileRef.current) {
      fileRef.current.removeAttribute("capture");
      fileRef.current.click();
    }
  };

  const handleChangeItem = (id: string, patch: Partial<ParsedItem>) => {
    setItems((s) => s.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const handleDelete = (id: string) => setItems((s) => s.filter((it) => it.id !== id));

  const closePreview = () => {
    setShowPreview(false);
    setItems([]);
    setEditingId(null);
  };

  return {
    fileRef,
    processing,
    items,
    showPreview,
    setShowPreview,
    handleFile,
    handleCapture,
    handleUpload,
    handleChangeItem,
    handleDelete,
    closePreview,
    setItems,
    editingId,
    setEditingId,
    categories: categoryStore.categories,
  };
}
