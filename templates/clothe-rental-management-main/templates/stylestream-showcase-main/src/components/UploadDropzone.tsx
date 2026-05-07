import { useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

export function UploadDropzone({ onFiles, className }: { onFiles?: (files: File[]) => void; className?: string }) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={e => { e.preventDefault(); setIsDragging(false); onFiles?.(Array.from(e.dataTransfer.files)); }}
      onClick={() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.onchange = () => input.files && onFiles?.(Array.from(input.files));
        input.click();
      }}
      className={cn(
        'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
        isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
        className
      )}
    >
      <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
      <p className="text-sm font-medium text-foreground">Kéo thả file hoặc click để chọn</p>
      <p className="text-xs text-muted-foreground mt-1">Hỗ trợ JPG, PNG, WEBP tối đa 10MB</p>
    </div>
  );
}
