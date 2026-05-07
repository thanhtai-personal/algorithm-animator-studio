import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { mode, toggleMode } = useTheme();
  return (
    <Button variant="ghost" size="icon" onClick={toggleMode} className="rounded-xl">
      {mode === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </Button>
  );
}
