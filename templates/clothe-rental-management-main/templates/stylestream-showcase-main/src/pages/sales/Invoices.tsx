import { useState } from 'react';
import { orders, payments, formatVND } from '@/data/mock';
import { StatusChip } from '@/components/StatusChip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Printer, Download, ReceiptText, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Invoices() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { toast } = useToast();

  const completedOrders = orders.filter(o => ['COMPLETED', 'PICKED_UP', 'RETURNED', 'CONFIRMED'].includes(o.status));
  const filtered = completedOrders.filter(o =>
    o.customerName.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search)
  );
  const selected = orders.find(o => o.id === selectedId);
  const orderPayments = selected ? payments.filter(p => p.orderId === selected.id) : [];
  const totalPaid = orderPayments.reduce((s, p) => s + (p.type === 'REFUND' ? -p.amount : p.amount), 0);

  const handlePrint = () => {
    toast({ title: 'In hóa đơn', description: `Đang in hóa đơn ${selectedId}...` });
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-7.5rem)]">
      {/* Order list */}
      <div className="w-full lg:w-96 border-r border-border flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground mb-2">Đơn hàng</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Tìm mã đơn / khách..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {filtered.map(o => (
            <button
              key={o.id}
              onClick={() => setSelectedId(o.id)}
              className={`w-full text-left px-4 py-3 border-b border-border hover:bg-accent transition-colors ${selectedId === o.id ? 'bg-accent' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{o.id}</span>
                <StatusChip status={o.status} />
              </div>
              <p className="text-sm text-foreground">{o.customerName}</p>
              <p className="text-xs text-muted-foreground">{formatVND(o.totalAmount)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Invoice preview */}
      <div className="flex-1 overflow-auto">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <ReceiptText className="w-12 h-12 opacity-40" />
            <p className="text-sm">Chọn đơn hàng để xem hóa đơn</p>
          </div>
        ) : (
          <div className="p-6 max-w-xl mx-auto animate-fade-in">
            {/* Actions */}
            <div className="flex gap-2 mb-6 justify-end">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-1" /> In
              </Button>
              <Button variant="outline" size="sm" onClick={() => toast({ title: 'Đã tải PDF' })}>
                <Download className="w-4 h-4 mr-1" /> PDF
              </Button>
            </div>

            {/* Invoice card */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-5">
              <div className="text-center border-b border-border pb-4">
                <h3 className="text-xl font-bold text-foreground">RentaFash</h3>
                <p className="text-xs text-muted-foreground">HÓA ĐƠN THUÊ TRANG PHỤC</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Mã đơn</p>
                  <p className="font-medium text-foreground">{selected.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Khách hàng</p>
                  <p className="font-medium text-foreground">{selected.customerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Ngày thuê</p>
                  <p className="font-medium text-foreground">{selected.rentalStart}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Ngày trả</p>
                  <p className="font-medium text-foreground">{selected.rentalEnd}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-2">SẢN PHẨM</p>
                <div className="space-y-2">
                  {selected.items.map(item => (
                    <div key={item.itemId} className="flex justify-between text-sm">
                      <span className="text-foreground">{item.productName}</span>
                      <span className="text-foreground font-medium">{formatVND(item.price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payments */}
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-2">THANH TOÁN</p>
                <div className="space-y-1.5">
                  {orderPayments.map(p => (
                    <div key={p.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{p.note} ({p.method})</span>
                      <span className={p.type === 'REFUND' ? 'text-destructive' : 'text-foreground'}>
                        {p.type === 'REFUND' ? '-' : '+'}{formatVND(p.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="border-t border-border pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tổng đơn</span>
                  <span className="text-foreground font-semibold">{formatVND(selected.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Đã thanh toán</span>
                  <span className="text-success font-semibold">{formatVND(totalPaid)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-foreground">Còn lại</span>
                  <span className={selected.totalAmount - totalPaid > 0 ? 'text-destructive' : 'text-success'}>
                    {formatVND(Math.max(0, selected.totalAmount - totalPaid))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
