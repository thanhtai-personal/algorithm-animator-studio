"use client";

import { useRef, useState } from "react";
import { Camera, UploadCloud } from "lucide-react";
import { DrawerFormShell } from "@/components/layout/DrawerFormShell";

interface ReceiptMediaPickerDrawerProps {
  title: string;
  description: string;
  triggerLabel: string;
  cameraLabel: string;
  uploadLabel: string;
  closeLabel: string;
  onFilesSelected: (files: FileList | null) => void;
}

export function ReceiptMediaPickerDrawer({
  title,
  description,
  triggerLabel,
  cameraLabel,
  uploadLabel,
  closeLabel,
  onFilesSelected,
}: ReceiptMediaPickerDrawerProps) {
  const [open, setOpen] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const handleFilesSelected = (files: FileList | null) => {
    onFilesSelected(files);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-border px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-accent sm:w-auto"
      >
        {triggerLabel}
      </button>

      <DrawerFormShell
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        widthClassName="max-w-md"
        footer={
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-accent"
          >
            {closeLabel}
          </button>
        }
      >
        <div className="grid gap-3">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            multiple
            className="hidden"
            onChange={(event) => {
              handleFilesSelected(event.currentTarget.files);
              event.currentTarget.value = "";
            }}
          />
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(event) => {
              handleFilesSelected(event.currentTarget.files);
              event.currentTarget.value = "";
            }}
          />

          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left transition hover:bg-accent"
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Camera className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold text-foreground">{cameraLabel}</span>
          </button>

          <button
            type="button"
            onClick={() => uploadInputRef.current?.click()}
            className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left transition hover:bg-accent"
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UploadCloud className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold text-foreground">{uploadLabel}</span>
          </button>
        </div>
      </DrawerFormShell>
    </>
  );
}
