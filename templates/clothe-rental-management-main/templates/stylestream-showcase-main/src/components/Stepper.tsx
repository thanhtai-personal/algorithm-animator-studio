import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepperProps {
  steps: string[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors',
              i < currentStep ? 'bg-primary text-primary-foreground border-primary' :
              i === currentStep ? 'border-primary text-primary bg-primary/10' :
              'border-border text-muted-foreground'
            )}>
              {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={cn(
              'text-[10px] mt-1.5 font-medium text-center whitespace-nowrap',
              i <= currentStep ? 'text-primary' : 'text-muted-foreground'
            )}>{step}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn('flex-1 h-0.5 mx-2 rounded-full mt-[-18px]', i < currentStep ? 'bg-primary' : 'bg-border')} />
          )}
        </div>
      ))}
    </div>
  );
}
