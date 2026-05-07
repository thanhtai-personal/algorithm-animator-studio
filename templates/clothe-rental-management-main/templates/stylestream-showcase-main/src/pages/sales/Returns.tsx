import { useState } from 'react';
import { orders, inventoryItems, products, formatVND } from '@/data/mock';
import { StatusChip } from '@/components/StatusChip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, PackageCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Condition = 'good' | 'minor_damage' | 'major_damage' | 'lost';

export default function Returns() {
  const [search, setSearch] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [conditions, setConditions] = useState<Record<string, Condition>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const activeOrders = orders.filter(o => ['PICKED_UP', 'CONFIRMED'].includes(o.status));
  const filtered = activeOrders.filter(o =>
    o.customerName.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search)
  );
  const selected = orders.find(o => o.id === selectedOrderId);

  const handleReturn = () => {
    toast({ title: 'Xác nhận trả hàng', description: `Đơn ${selectedOrderId} đã được xử lý trả hàng.` });
    setSelectedOrderId(null);
    setConditions({});
    setNotes({});
  };

  const conditionLabel: Record<Condition, { text: string; color: string }> = {
    good: { text: 'Tốt', color: 'text-success' },
    minor_damage: { text: 'Hư nhẹ', color: 'text-warning' },
    major_damage: { text: 'Hư nặng', color: 'text-destructive' },
    lost: { text: 'Mất', color: 'text-destructive' },
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-7.5rem)]">
      {/* Order list */}
      <div className="w-full lg:w-96 border-r border-border flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground mb-2">Đơn đang thuê</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Tìm mã đơn / khách..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Không có đơn nào</p>
          ) : filtered.map(o => (
            <button
              key={o.id}
              onClick={() => setSelectedOrderId(o.id)}
              className={`w-full text-left px-4 py-3 border-b border-border hover:bg-accent transition-colors ${selectedOrderId === o.id ? 'bg-accent' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{o.id}</span>
                <StatusChip status={o.status} />
              </div>
              <p className="text-sm text-foreground">{o.customerName}</p>
              <p className="text-xs text-muted-foreground">Hạn trả: {o.rentalEnd} · {o.items.length} SP</p>
            </button>
          ))}
        </div>
      </div>

      {/* Return detail */}
      <div className="flex-1 overflow-auto">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <PackageCheck className="w-12 h-12 opacity-40" />
            <p className="text-sm">Chọn đơn hàng để xử lý trả</p>
          </div>
        ) : (
          <div className="p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-foreground">Trả hàng — {selected.id}</h2>
              <p className="text-sm text-muted-foreground">{selected.customerName} · Hạn trả: {selected.rentalEnd}</p>
            </div>

            {/* Check each item */}
            <div className="space-y-4">
              {selected.items.map(item => {
                const cond = conditions[item.itemId] || 'good';
                return (
                  <div key={item.itemId} className="bg-card rounded-xl border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">Mã: {item.itemId} · {formatVND(item.price)}/ngày</p>
                      </div>
                      <span className={`text-sm font-medium ${conditionLabel[cond].color}`}>
                        {conditionLabel[cond].text}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {(Object.keys(conditionLabel) as Condition[]).map(c => (
                        <Button
                          key={c}
                          variant={cond === c ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setConditions({ ...conditions, [item.itemId]: c })}
                        >
                          {conditionLabel[c].text}
                        </Button>
                      ))}
                    </div>
                    {(cond === 'minor_damage' || cond === 'major_damage' || cond === 'lost') && (
                      <Textarea
                        placeholder="Ghi chú sự cố..."
                        value={notes[item.itemId] || ''}
                        onChange={e => setNotes({ ...notes, [item.itemId]: e.target.value })}
                        className="h-16"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Penalty summary */}
            {Object.values(conditions).some(c => c !== 'good') && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Có sự cố cần xử lý</p>
                  <p className="text-xs text-muted-foreground">Phí phạt sẽ được tính sau khi xác nhận trả hàng.</p>
                </div>
              </div>
            )}

            <Button className="w-full" size="lg" onClick={handleReturn}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Xác nhận trả hàng
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
