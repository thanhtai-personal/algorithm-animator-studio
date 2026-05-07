"use client";

import { Card } from '@/components/ui/card';
import { formatCurrency, formatCompactNumber } from '@/lib/currency';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface BalanceCardProps {
  balance: number;
  totalIncome: number;
  totalExpense: number;
}

export function BalanceCard({ balance, totalIncome, totalExpense }: BalanceCardProps) {
  const { t, language, localeCode, currency } = useI18n();

  return (
    <Card variant="gradient" className="relative overflow-hidden p-6 animate-slide-up"
      style={{
        background: "linear-gradient(45deg, hsl(var(--primary) / 0.85), hsl(var(--secondary, var(--primary)) / 0.92))",
      }}
    >
      {/* Decorative circles */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute -right-4 top-16 w-20 h-20 rounded-full bg-white/5" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="text-white/80 text-sm font-medium">{t('dashboard.currentBalance')}</span>
        </div>
        
        <div className="mb-6">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            {formatCurrency(balance, currency, localeCode)}
          </h2>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-success/80 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-white/70 text-xs">{t('dashboard.income')}</span>
            </div>
            <p className="text-white font-bold text-sm">
              +{formatCompactNumber(totalIncome, language)}
            </p>
          </div>

          <div className="flex-1 bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-white/30 flex items-center justify-center">
                <TrendingDown className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-white/70 text-xs">{t('dashboard.expense')}</span>
            </div>
            <p className="text-white font-bold text-sm">
              -{formatCompactNumber(totalExpense, language)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
