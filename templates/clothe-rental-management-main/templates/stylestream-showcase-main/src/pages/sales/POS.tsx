import { useState, useMemo } from 'react';
import { products, customers, inventoryItems, formatVND } from '@/data/mock';
import { Product, Customer, OrderItem } from '@/data/types';
import { StatusChip } from '@/components/StatusChip';
import { MoneyInput } from '@/components/MoneyInput';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Minus, Trash2, User, ShoppingBag, CalendarDays, CheckCircle2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  product: Product;
  itemId: string;
  size: string;
  color: string;
  price: number;
}

export default function POS() {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [deposit, setDeposit] = useState(0);
  const [rentalDays, setRentalDays] = useState(3);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showReturnDrawer, setShowReturnDrawer] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const { toast } = useToast();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [search]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }, [customerSearch]);

  const total = cart.reduce((s, c) => s + c.price * rentalDays, 0);
  const remaining = total - deposit;

  const addToCart = (product: Product) => {
    const available = inventoryItems.filter(i => i.productId === product.id && i.status === 'READY');
    if (available.length === 0) {
      toast({ title: 'Hết hàng', description: `${product.name} không còn sẵn`, variant: 'destructive' });
      return;
    }
    const item = available[0];
    if (cart.find(c => c.itemId === item.id)) {
      toast({ title: 'Đã có', description: 'Sản phẩm này đã trong giỏ' });
      return;
    }
    setCart([...cart, { product, itemId: item.id, size: item.size, color: item.color, price: product.price }]);
  };

  const removeFromCart = (itemId: string) => setCart(cart.filter(c => c.itemId !== itemId));

  const handleCreateOrder = () => {
    setShowConfirm(false);
    setOrderCreated(true);
    toast({ title: 'Tạo đơn thành công!', description: `Đơn hàng cho ${selectedCustomer?.name} — ${formatVND(total)}` });
    setTimeout(() => {
      setCart([]);
      setSelectedCustomer(null);
      setDeposit(0);
      setOrderCreated(false);
    }, 2000);
  };

  const handleCreateReturnOrder = () => {
    setShowReturnDrawer(false);
    toast({ title: 'Tạo đơn trả thành công!', description: `Tạo đơn trả cho ${selectedCustomer?.name}` });
    setCart([]);
    setSelectedCustomer(null);
    setDeposit(0);
  };

  if (orderCreated) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 animate-fade-in">
        <CheckCircle2 className="w-16 h-16 text-success" />
        <h2 className="text-2xl font-bold text-foreground">Đơn hàng đã tạo!</h2>
        <p className="text-muted-foreground">Đang quay lại...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-0 h-[calc(100vh-7.5rem)]">
      {/* Left: product grid */}
      <div className="flex-1 flex flex-col border-r border-border min-w-0">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm sản phẩm..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map(p => {
              const avail = inventoryItems.filter(i => i.productId === p.id && i.status === 'READY').length;
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="bg-card rounded-xl border border-border p-3 text-left hover:border-primary hover:shadow-md transition-all group"
                >
                  <div className="aspect-[4/3] rounded-lg mb-2 flex items-center justify-center text-2xl" style={{ background: p.gradient }}>
                    <ShoppingBag className="w-8 h-8 text-white/70 group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.category}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-sm font-semibold text-primary">{formatVND(p.price)}</span>
                    <Badge variant={avail > 0 ? 'secondary' : 'destructive'} className="text-[10px]">
                      {avail > 0 ? `${avail} sẵn` : 'Hết'}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: cart & checkout */}
      <div className="w-full lg:w-[420px] flex flex-col bg-card shrink-0">
        {/* Customer select */}
        <div className="p-4 border-b border-border space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <User className="w-4 h-4" /> Khách hàng
          </div>
          {selectedCustomer ? (
            <div className="flex items-center justify-between bg-accent rounded-lg px-3 py-2">
              <div>
                <p className="text-sm font-medium text-foreground">{selectedCustomer.name}</p>
                <p className="text-xs text-muted-foreground">{selectedCustomer.phone}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>Đổi</Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Input placeholder="Tìm tên / SĐT..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} />
              {customerSearch && (
                <div className="bg-accent rounded-lg max-h-32 overflow-auto">
                  {filteredCustomers.map(c => (
                    <button key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); }}
                      className="w-full text-left px-3 py-2 hover:bg-primary/10 text-sm flex items-center justify-between">
                      <span className="text-foreground">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{c.phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rental days */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-foreground">Ngày thuê:</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setRentalDays(Math.max(1, rentalDays - 1))}><Minus className="w-3 h-3" /></Button>
            <span className="w-8 text-center text-sm font-semibold text-foreground">{rentalDays}</span>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setRentalDays(rentalDays + 1)}><Plus className="w-3 h-3" /></Button>
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ShoppingBag className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">Chưa có sản phẩm</p>
            </div>
          ) : cart.map(c => (
            <div key={c.itemId} className="flex items-center gap-3 bg-accent rounded-lg p-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: c.product.gradient }}>
                <ShoppingBag className="w-4 h-4 text-white/80" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{c.product.name}</p>
                <p className="text-xs text-muted-foreground">{c.size} · {c.color} · {formatVND(c.price)}/ngày</p>
              </div>
              <button onClick={() => removeFromCart(c.itemId)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Checkout summary */}
        <div className="border-t border-border p-4 space-y-3">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>{cart.length} sản phẩm × {rentalDays} ngày</span>
              <span className="text-foreground font-medium">{formatVND(total)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Đặt cọc:</span>
              <MoneyInput value={deposit} onChange={setDeposit} className="w-40" />
            </div>
            <div className="flex justify-between font-semibold text-foreground pt-1 border-t border-border">
              <span>Còn lại:</span>
              <span className={remaining < 0 ? 'text-destructive' : ''}>{formatVND(Math.max(0, remaining))}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Button
              className="w-full"
              size="lg"
              disabled={cart.length === 0 || !selectedCustomer}
              onClick={() => setShowConfirm(true)}
            >
              Tạo đơn thuê — {formatVND(total)}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              size="lg"
              disabled={cart.length === 0 || !selectedCustomer}
              onClick={() => setShowReturnDrawer(true)}
            >
              Tạo đơn trả
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Xác nhận tạo đơn"
        description={`Tạo đơn thuê ${cart.length} sản phẩm cho ${selectedCustomer?.name}, tổng ${formatVND(total)}, cọc ${formatVND(deposit)}?`}
        onConfirm={handleCreateOrder}
      />

      <Drawer open={showReturnDrawer} onOpenChange={setShowReturnDrawer}>
        <DrawerContent>
          <DrawerHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <DrawerTitle>Tạo đơn trả</DrawerTitle>
                <DrawerDescription>Hoàn tất trả hàng và ghi nhận trạng thái hoàn cọc.</DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="space-y-4 px-4 pb-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Khách hàng</p>
              <p className="mt-1 text-base font-medium text-foreground">{selectedCustomer?.name ?? 'Chưa chọn khách hàng'}</p>
              {selectedCustomer?.phone ? <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p> : null}
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Sản phẩm trả</span>
                <span>{cart.length} mục</span>
              </div>
              {cart.map((item) => (
                <div key={item.itemId} className="flex items-center justify-between text-sm text-foreground">
                  <span>{item.product.name}</span>
                  <span>{formatVND(item.price)}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Tổng tiền thu lại</span>
                <span>{formatVND(total)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Đặt cọc hoàn trả</span>
                <span>{formatVND(deposit)}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                <span>Số tiền trả khách</span>
                <span>{formatVND(Math.max(0, total - deposit))}</span>
              </div>
            </div>
          </div>

          <DrawerFooter>
            <Button className="w-full" onClick={handleCreateReturnOrder}>
              Xác nhận tạo đơn trả
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
