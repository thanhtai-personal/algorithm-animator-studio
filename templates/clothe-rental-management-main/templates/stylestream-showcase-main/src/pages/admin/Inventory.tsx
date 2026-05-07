import { useState } from 'react';
import { inventoryItems as initialItems, products } from '@/data/mock';
import { StatusChip } from '@/components/StatusChip';
import { DataTable } from '@/components/DataTable';
import { ItemStatus } from '@/data/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const allStatuses: ItemStatus[] = ['READY','RESERVED','ON_RENT','LAUNDRY','MAINTENANCE','DAMAGED','LOST','RETIRED'];

export default function Inventory() {
  const [items, setItems] = useState(initialItems);
  const [selected, setSelected] = useState<typeof items[0] | null>(null);
  const [newStatus, setNewStatus] = useState<ItemStatus>('READY');

  const getProductName = (pid: string) => products.find(p => p.id === pid)?.name || pid;

  const changeStatus = () => {
    if (!selected) return;
    setItems(prev => prev.map(i => i.id === selected.id ? { ...i, status: newStatus, lastUpdated: '2026-02-28' } : i));
    setSelected(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Kho hàng</h1>
        <p className="text-sm text-muted-foreground">{items.length} items</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {allStatuses.map(s => (
          <span key={s} className="cursor-pointer"><StatusChip status={s} /></span>
        ))}
      </div>

      <DataTable
        columns={[
          { key: 'sku', label: 'SKU', render: r => <span className="font-mono text-xs">{r.sku}</span> },
          { key: 'productId', label: 'Sản phẩm', render: r => getProductName(r.productId) },
          { key: 'size', label: 'Size' },
          { key: 'color', label: 'Màu' },
          { key: 'status', label: 'Trạng thái', render: r => <StatusChip status={r.status} /> },
          { key: 'condition', label: 'Tình trạng' },
          { key: 'lastUpdated', label: 'Cập nhật' },
        ]}
        data={items}
        onRowClick={r => { setSelected(r); setNewStatus(r.status); }}
      />

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>Chi tiết Item</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div><label className="text-sm text-muted-foreground">SKU</label><p className="font-mono">{selected.sku}</p></div>
                <div><label className="text-sm text-muted-foreground">Sản phẩm</label><p>{getProductName(selected.productId)}</p></div>
                <div><label className="text-sm text-muted-foreground">Size / Màu</label><p>{selected.size} / {selected.color}</p></div>
                <div><label className="text-sm text-muted-foreground">Trạng thái hiện tại</label><div className="mt-1"><StatusChip status={selected.status} /></div></div>
                <div>
                  <label className="text-sm text-muted-foreground">Đổi trạng thái</label>
                  <Select value={newStatus} onValueChange={v => setNewStatus(v as ItemStatus)}>
                    <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{allStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button className="w-full rounded-xl" onClick={changeStatus}>Cập nhật trạng thái</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
