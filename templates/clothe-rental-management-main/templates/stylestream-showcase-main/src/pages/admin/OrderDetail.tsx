import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { orders, formatVND } from '@/data/mock';
import { StatusChip } from '@/components/StatusChip';
import { Stepper } from '@/components/Stepper';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useState } from 'react';
import { OrderStatus } from '@/data/types';

const ORDER_STEPS: OrderStatus[] = ['DRAFT','RESERVED','CONFIRMED','PICKED_UP','RETURNED','COMPLETED'];

export default function OrderDetail() {
  const { id } = useParams();
  const order = orders.find(o => o.id === id);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState('');

  if (!order) return <div className="text-center py-12 text-muted-foreground">Đơn hàng không tồn tại</div>;

  const currentStep = order.status === 'CANCELLED' ? -1 : ORDER_STEPS.indexOf(order.status);

  const openConfirm = (action: string) => { setConfirmAction(action); setConfirmOpen(true); };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/admin/orders" className="p-2 rounded-lg hover:bg-accent text-muted-foreground"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">Đơn {order.id}</h1>
            <StatusChip status={order.status} />
          </div>
          <p className="text-sm text-muted-foreground">{order.customerName} · Tạo {order.createdAt}</p>
        </div>
      </div>

      {order.status !== 'CANCELLED' && (
        <div className="bg-card rounded-xl border border-border p-6">
          <Stepper steps={ORDER_STEPS.map(s => s.replace('_', ' '))} currentStep={Math.max(0, currentStep)} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-3">Sản phẩm</h3>
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="font-medium text-foreground">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">Item: {item.itemId}</p>
                </div>
                <p className="font-medium text-foreground">{formatVND(item.price)}</p>
              </div>
            ))}
          </div>

          {order.notes && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground mb-2">Ghi chú</h3>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-2">
            <h3 className="font-semibold text-foreground mb-3">Thanh toán</h3>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tổng tiền thuê</span><span className="text-foreground">{formatVND(order.totalAmount)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Đặt cọc</span><span className="text-foreground">{formatVND(order.deposit)}</span></div>
            <div className="flex justify-between text-sm font-semibold border-t border-border pt-2"><span className="text-foreground">Còn lại</span><span className="text-primary">{formatVND(order.totalAmount - order.deposit)}</span></div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-2">
            <h3 className="font-semibold text-foreground mb-3">Thời gian</h3>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Bắt đầu</span><span>{order.rentalStart}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Kết thúc</span><span>{order.rentalEnd}</span></div>
          </div>

          <div className="space-y-2">
            <Button className="w-full rounded-xl" onClick={() => openConfirm('confirm')}>Xác nhận đơn</Button>
            <Button variant="outline" className="w-full rounded-xl" onClick={() => openConfirm('pickup')}>Giao hàng</Button>
            <Button variant="outline" className="w-full rounded-xl text-destructive" onClick={() => openConfirm('cancel')}>Hủy đơn</Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Xác nhận ${confirmAction}`}
        description={`Bạn có chắc muốn ${confirmAction} đơn hàng ${order.id}?`}
        onConfirm={() => setConfirmOpen(false)}
        variant={confirmAction === 'cancel' ? 'destructive' : 'default'}
      />
    </div>
  );
}
