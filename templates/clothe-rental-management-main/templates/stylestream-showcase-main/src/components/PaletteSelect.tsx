import { useTheme, PALETTES, PaletteName } from '@/contexts/ThemeContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PaletteSelect() {
  const { palette, setPalette } = useTheme();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-xl">
          <Palette className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="end">
        <p className="text-xs font-medium text-muted-foreground mb-2 px-2">Bảng màu</p>
        <div className="space-y-0.5">
          {(Object.keys(PALETTES) as PaletteName[]).map(key => (
            <button
              key={key}
              onClick={() => setPalette(key)}
              className={cn(
                'flex items-center gap-3 w-full px-2 py-1.5 rounded-lg text-sm transition-colors',
                palette === key ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent text-foreground'
              )}
            >
              <span className="w-4 h-4 rounded-full shrink-0 border border-border" style={{ background: PALETTES[key].swatch }} />
              {PALETTES[key].label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
