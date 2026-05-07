import { Product, InventoryItem, Order, Customer, Payment } from './types';

export const products: Product[] = [
  { id: 'p1', name: 'Áo Dài Truyền Thống', category: 'Áo Dài', price: 500000, images: [], sizes: ['S','M','L','XL'], colors: ['Đỏ','Xanh','Trắng'], description: 'Áo dài truyền thống Việt Nam, chất liệu lụa cao cấp, thêu hoa văn tinh tế.', tags: ['truyền thống','lụa','cưới'], gradient: 'linear-gradient(135deg, hsl(0,70%,60%), hsl(340,80%,45%))' },
  { id: 'p2', name: 'Đầm Dạ Hội Sequin', category: 'Đầm Dạ Hội', price: 800000, images: [], sizes: ['S','M','L'], colors: ['Đen','Vàng','Bạc'], description: 'Đầm dạ hội đính sequin lấp lánh, thiết kế ôm dáng quyến rũ.', tags: ['dạ hội','sequin','sang trọng'], gradient: 'linear-gradient(135deg, hsl(45,80%,55%), hsl(35,90%,45%))' },
  { id: 'p3', name: 'Vest Nam Cao Cấp', category: 'Vest', price: 600000, images: [], sizes: ['M','L','XL','XXL'], colors: ['Đen','Xám','Navy'], description: 'Bộ vest nam cao cấp, chất liệu wool blend, phom dáng Slim Fit.', tags: ['vest','nam','công sở'], gradient: 'linear-gradient(135deg, hsl(220,20%,25%), hsl(210,30%,35%))' },
  { id: 'p4', name: 'Áo Dài Cách Tân', category: 'Áo Dài', price: 450000, images: [], sizes: ['S','M','L'], colors: ['Hồng','Tím','Xanh mint'], description: 'Áo dài cách tân hiện đại, phối màu trendy, phù hợp sự kiện và chụp ảnh.', tags: ['cách tân','hiện đại','trendy'], gradient: 'linear-gradient(135deg, hsl(310,50%,60%), hsl(280,60%,50%))' },
  { id: 'p5', name: 'Đầm Công Chúa', category: 'Đầm Dạ Hội', price: 1200000, images: [], sizes: ['S','M','L'], colors: ['Trắng','Hồng','Champagne'], description: 'Đầm công chúa xòe bồng, đính ren và đá crystal, lộng lẫy cho tiệc cưới.', tags: ['công chúa','cưới','ren'], gradient: 'linear-gradient(135deg, hsl(340,60%,75%), hsl(350,50%,65%))' },
  { id: 'p6', name: 'Tuxedo Classic', category: 'Vest', price: 700000, images: [], sizes: ['M','L','XL'], colors: ['Đen','Trắng'], description: 'Tuxedo cổ điển phong cách Hollywood, kèm nơ và áo sơ mi trắng.', tags: ['tuxedo','classic','gala'], gradient: 'linear-gradient(135deg, hsl(0,0%,15%), hsl(0,0%,30%))' },
  { id: 'p7', name: 'Áo Cưới Trắng', category: 'Áo Cưới', price: 2000000, images: [], sizes: ['S','M','L'], colors: ['Trắng','Ivory'], description: 'Áo cưới trắng tinh khôi, đuôi cá dài 2m, đính ren Pháp nhập khẩu.', tags: ['cưới','trắng','ren Pháp'], gradient: 'linear-gradient(135deg, hsl(30,20%,92%), hsl(40,30%,85%))' },
  { id: 'p8', name: 'Đầm Cocktail', category: 'Đầm Cocktail', price: 400000, images: [], sizes: ['S','M','L','XL'], colors: ['Đỏ','Đen','Xanh cobalt'], description: 'Đầm cocktail ngắn trên gối, thiết kế trẻ trung năng động cho tiệc tối.', tags: ['cocktail','trẻ trung','tiệc'], gradient: 'linear-gradient(135deg, hsl(210,70%,50%), hsl(230,60%,40%))' },
];

export const inventoryItems: InventoryItem[] = [
  { id: 'i1', productId: 'p1', sku: 'AD-001-S-DO', size: 'S', color: 'Đỏ', status: 'READY', condition: 'Mới', lastUpdated: '2026-02-28' },
  { id: 'i2', productId: 'p1', sku: 'AD-001-M-DO', size: 'M', color: 'Đỏ', status: 'ON_RENT', condition: 'Tốt', lastUpdated: '2026-02-27' },
  { id: 'i3', productId: 'p1', sku: 'AD-001-L-TR', size: 'L', color: 'Trắng', status: 'LAUNDRY', condition: 'Tốt', lastUpdated: '2026-02-26' },
  { id: 'i4', productId: 'p2', sku: 'DDH-002-S-DE', size: 'S', color: 'Đen', status: 'READY', condition: 'Mới', lastUpdated: '2026-02-28' },
  { id: 'i5', productId: 'p2', sku: 'DDH-002-M-VA', size: 'M', color: 'Vàng', status: 'RESERVED', condition: 'Tốt', lastUpdated: '2026-02-27' },
  { id: 'i6', productId: 'p3', sku: 'VN-003-L-DE', size: 'L', color: 'Đen', status: 'READY', condition: 'Mới', lastUpdated: '2026-02-28' },
  { id: 'i7', productId: 'p3', sku: 'VN-003-XL-XA', size: 'XL', color: 'Xám', status: 'MAINTENANCE', condition: 'Cần sửa', lastUpdated: '2026-02-25' },
  { id: 'i8', productId: 'p4', sku: 'ADCT-004-M-HO', size: 'M', color: 'Hồng', status: 'ON_RENT', condition: 'Tốt', lastUpdated: '2026-02-26' },
  { id: 'i9', productId: 'p5', sku: 'DCC-005-S-TR', size: 'S', color: 'Trắng', status: 'READY', condition: 'Mới', lastUpdated: '2026-02-28' },
  { id: 'i10', productId: 'p5', sku: 'DCC-005-M-HO', size: 'M', color: 'Hồng', status: 'DAMAGED', condition: 'Rách nhẹ', lastUpdated: '2026-02-24' },
  { id: 'i11', productId: 'p6', sku: 'TUX-006-L-DE', size: 'L', color: 'Đen', status: 'READY', condition: 'Mới', lastUpdated: '2026-02-28' },
  { id: 'i12', productId: 'p7', sku: 'ACU-007-M-TR', size: 'M', color: 'Trắng', status: 'ON_RENT', condition: 'Tốt', lastUpdated: '2026-02-27' },
  { id: 'i13', productId: 'p8', sku: 'DCT-008-S-DO', size: 'S', color: 'Đỏ', status: 'READY', condition: 'Tốt', lastUpdated: '2026-02-28' },
  { id: 'i14', productId: 'p8', sku: 'DCT-008-M-DE', size: 'M', color: 'Đen', status: 'RETIRED', condition: 'Cũ', lastUpdated: '2026-02-20' },
];

export const customers: Customer[] = [
  { id: 'c1', name: 'Nguyễn Thị Mai', email: 'mai.nguyen@email.com', phone: '0901234567', vip: true, blacklisted: false, totalOrders: 12, totalSpent: 15600000, createdAt: '2025-06-15' },
  { id: 'c2', name: 'Trần Văn Hùng', email: 'hung.tran@email.com', phone: '0912345678', vip: false, blacklisted: false, totalOrders: 3, totalSpent: 2400000, createdAt: '2025-09-20' },
  { id: 'c3', name: 'Lê Thị Hương', email: 'huong.le@email.com', phone: '0923456789', vip: true, blacklisted: false, totalOrders: 8, totalSpent: 9800000, createdAt: '2025-07-10' },
  { id: 'c4', name: 'Phạm Đức Anh', email: 'anh.pham@email.com', phone: '0934567890', vip: false, blacklisted: true, totalOrders: 2, totalSpent: 1200000, createdAt: '2025-11-05' },
  { id: 'c5', name: 'Hoàng Thị Lan', email: 'lan.hoang@email.com', phone: '0945678901', vip: false, blacklisted: false, totalOrders: 5, totalSpent: 4500000, createdAt: '2025-08-22' },
];

export const orders: Order[] = [
  { id: 'o1', customerId: 'c1', customerName: 'Nguyễn Thị Mai', status: 'PICKED_UP', items: [{ productId: 'p1', productName: 'Áo Dài Truyền Thống', itemId: 'i2', price: 500000 }], totalAmount: 1500000, deposit: 500000, rentalStart: '2026-02-26', rentalEnd: '2026-02-28', createdAt: '2026-02-25', notes: 'Khách VIP, ưu tiên' },
  { id: 'o2', customerId: 'c2', customerName: 'Trần Văn Hùng', status: 'RESERVED', items: [{ productId: 'p2', productName: 'Đầm Dạ Hội Sequin', itemId: 'i5', price: 800000 }], totalAmount: 2400000, deposit: 800000, rentalStart: '2026-03-01', rentalEnd: '2026-03-03', createdAt: '2026-02-27', notes: '' },
  { id: 'o3', customerId: 'c3', customerName: 'Lê Thị Hương', status: 'COMPLETED', items: [{ productId: 'p4', productName: 'Áo Dài Cách Tân', itemId: 'i8', price: 450000 }, { productId: 'p8', productName: 'Đầm Cocktail', itemId: 'i13', price: 400000 }], totalAmount: 2550000, deposit: 850000, rentalStart: '2026-02-20', rentalEnd: '2026-02-23', createdAt: '2026-02-19', notes: 'Đã trả đúng hẹn' },
  { id: 'o4', customerId: 'c1', customerName: 'Nguyễn Thị Mai', status: 'CONFIRMED', items: [{ productId: 'p7', productName: 'Áo Cưới Trắng', itemId: 'i12', price: 2000000 }], totalAmount: 6000000, deposit: 2000000, rentalStart: '2026-03-05', rentalEnd: '2026-03-07', createdAt: '2026-02-28', notes: 'Đám cưới Q7' },
  { id: 'o5', customerId: 'c5', customerName: 'Hoàng Thị Lan', status: 'DRAFT', items: [{ productId: 'p3', productName: 'Vest Nam Cao Cấp', itemId: 'i6', price: 600000 }], totalAmount: 1800000, deposit: 600000, rentalStart: '2026-03-10', rentalEnd: '2026-03-12', createdAt: '2026-02-28', notes: 'Chờ xác nhận' },
  { id: 'o6', customerId: 'c4', customerName: 'Phạm Đức Anh', status: 'CANCELLED', items: [{ productId: 'p6', productName: 'Tuxedo Classic', itemId: 'i11', price: 700000 }], totalAmount: 2100000, deposit: 700000, rentalStart: '2026-02-15', rentalEnd: '2026-02-17', createdAt: '2026-02-14', notes: 'Khách hủy đột xuất' },
];

export const payments: Payment[] = [
  { id: 'pay1', orderId: 'o1', customerName: 'Nguyễn Thị Mai', amount: 500000, type: 'DEPOSIT', method: 'TRANSFER', date: '2026-02-25', note: 'Đặt cọc' },
  { id: 'pay2', orderId: 'o2', customerName: 'Trần Văn Hùng', amount: 800000, type: 'DEPOSIT', method: 'CASH', date: '2026-02-27', note: 'Đặt cọc tiền mặt' },
  { id: 'pay3', orderId: 'o3', customerName: 'Lê Thị Hương', amount: 850000, type: 'DEPOSIT', method: 'TRANSFER', date: '2026-02-19', note: 'Đặt cọc' },
  { id: 'pay4', orderId: 'o3', customerName: 'Lê Thị Hương', amount: 1700000, type: 'RENTAL', method: 'TRANSFER', date: '2026-02-23', note: 'Thanh toán còn lại' },
  { id: 'pay5', orderId: 'o4', customerName: 'Nguyễn Thị Mai', amount: 2000000, type: 'DEPOSIT', method: 'CARD', date: '2026-02-28', note: 'Đặt cọc thẻ' },
  { id: 'pay6', orderId: 'o6', customerName: 'Phạm Đức Anh', amount: 350000, type: 'REFUND', method: 'TRANSFER', date: '2026-02-16', note: 'Hoàn 50% cọc do hủy' },
  { id: 'pay7', orderId: 'o1', customerName: 'Nguyễn Thị Mai', amount: 1000000, type: 'RENTAL', method: 'CASH', date: '2026-02-26', note: 'Thanh toán khi lấy hàng' },
];

export const categories = ['Áo Dài', 'Đầm Dạ Hội', 'Vest', 'Áo Cưới', 'Đầm Cocktail'];

export const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

export const dashboardStats = {
  revenue: 42500000,
  revenueChange: 12.5,
  activeOrders: 3,
  availableItems: 7,
  totalCustomers: 5,
};
