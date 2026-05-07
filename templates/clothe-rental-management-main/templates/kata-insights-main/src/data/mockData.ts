export const branchOptions = [
  { value: "hcm-q1", label: "KATA Quận 1" },
  { value: "hcm-q3", label: "KATA Quận 3" },
  { value: "hn-hk", label: "KATA Hoàn Kiếm" },
];

export const formatMoney = (amount: number): string => {
  return amount.toLocaleString("vi-VN") + " đ";
};

export const formatMoneyShort = (amount: number): string => {
  if (amount >= 1_000_000_000) return (amount / 1_000_000_000).toFixed(1) + " tỷ";
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1) + " tr";
  if (amount >= 1_000) return (amount / 1_000).toFixed(0) + "k";
  return amount.toString();
};

export const kpiData = {
  revenue: { value: 127_500_000, change: 12.5, label: "Doanh thu thực", sub: "Sau hoàn cọc và giảm trừ" },
  profit: { value: 48_200_000, change: 8.3, label: "Lợi nhuận thực", sub: "Sau chi phí phát sinh" },
  deposit: { value: 35_000_000, change: -2.1, label: "Tiền cọc đang giữ", sub: "Chưa hoàn trả" },
  debt: { value: 18_500_000, change: 15.2, label: "Công nợ còn lại", sub: "Chưa thu hồi" },
};

export const overviewData = {
  health: {
    revenue: 127_500_000,
    profit: 48_200_000,
    activeOrders: 23,
    dueTodayOrders: 5,
    overdueOrders: 3,
  },
  cashflow: {
    moneyIn: 142_000_000,
    moneyOut: 93_800_000,
    depositCollected: 45_000_000,
    depositReturned: 10_000_000,
    openDebt: 18_500_000,
  },
  inventory: {
    washing: 12,
    preparing: 8,
    ready: 156,
    sold: 34,
  },
};

export const urgentOrders = {
  dueSoon: [
    { id: "ĐT-2401", customer: "Nguyễn Thị Mai", phone: "0901234567", items: "Áo dài cưới hồng", dueDate: "Hôm nay 14:00", amount: 3_500_000 },
    { id: "ĐT-2398", customer: "Trần Văn Hùng", phone: "0912345678", items: "Vest nam xanh navy", dueDate: "Hôm nay 17:00", amount: 2_000_000 },
    { id: "ĐT-2395", customer: "Lê Thị Hương", phone: "0923456789", items: "Đầm dạ hội đỏ", dueDate: "Ngày mai 09:00", amount: 4_500_000 },
    { id: "ĐT-2392", customer: "Phạm Minh Tuấn", phone: "0934567890", items: "Áo dài nam trắng", dueDate: "Ngày mai 10:00", amount: 1_800_000 },
    { id: "ĐT-2390", customer: "Võ Thị Lan", phone: "0945678901", items: "Váy cưới trắng", dueDate: "Ngày mai 14:00", amount: 8_000_000 },
  ],
  overdue: [
    { id: "ĐT-2380", customer: "Hoàng Văn Nam", phone: "0956789012", items: "Vest cưới ghi xám", dueDate: "Quá 2 ngày", amount: 2_500_000, penalty: 500_000 },
    { id: "ĐT-2375", customer: "Đỗ Thị Thanh", phone: "0967890123", items: "Áo dài lụa đỏ", dueDate: "Quá 3 ngày", amount: 3_000_000, penalty: 900_000 },
    { id: "ĐT-2370", customer: "Bùi Quang Hải", phone: "0978901234", items: "Vest xanh + phụ kiện", dueDate: "Quá 5 ngày", amount: 4_200_000, penalty: 2_100_000 },
  ],
  preparing: [
    { id: "ĐT-2405", items: "Áo dài cưới vàng", pickupDate: "Ngày mai 08:00", status: "Cần ủi" },
    { id: "ĐT-2407", items: "Vest đen classic", pickupDate: "Ngày mai 09:00", status: "Đang giặt" },
    { id: "ĐT-2410", items: "Đầm dạ hội xanh", pickupDate: "Ngày mai 10:00", status: "Cần kiểm tra" },
    { id: "ĐT-2412", items: "Set phụ dâu hồng x3", pickupDate: "Ngày mai 13:00", status: "Sẵn sàng" },
    { id: "ĐT-2415", items: "Áo dài mẹ cô dâu", pickupDate: "Ngày kia 08:00", status: "Cần ủi" },
  ],
};

export const revenueData = {
  gross: 152_000_000,
  discount: 12_500_000,
  refund: 12_000_000,
  net: 127_500_000,
  depositIn: 45_000_000,
  depositOut: 10_000_000,
  expenses: 79_300_000,
  grossProfit: 73_200_000,
  netProfit: 48_200_000,
  newDebt: 8_500_000,
  remainingDebt: 18_500_000,
  byCategory: [
    { name: "Thuê đồ", value: 95_000_000, percent: 62 },
    { name: "Bán hàng", value: 28_000_000, percent: 18 },
    { name: "Trang điểm", value: 18_500_000, percent: 12 },
    { name: "Dịch vụ khác", value: 10_500_000, percent: 7 },
  ],
  comparison: {
    lastPeriod: { revenue: 113_400_000, profit: 44_600_000 },
    thisPeriod: { revenue: 127_500_000, profit: 48_200_000 },
  },
};

export const chartData = {
  daily: [
    { date: "18/03", revenue: 15_200_000, profit: 5_800_000 },
    { date: "19/03", revenue: 18_500_000, profit: 7_200_000 },
    { date: "20/03", revenue: 12_800_000, profit: 4_900_000 },
    { date: "21/03", revenue: 22_100_000, profit: 8_500_000 },
    { date: "22/03", revenue: 19_600_000, profit: 7_600_000 },
    { date: "23/03", revenue: 16_300_000, profit: 6_200_000 },
    { date: "24/03", revenue: 23_000_000, profit: 8_000_000 },
  ],
};

export const shiftLog = [
  { time: "08:30", action: "Mở ca", user: "Minh Anh", detail: "Ca sáng" },
  { time: "09:15", action: "Giao đồ", user: "Minh Anh", detail: "ĐT-2401 - Áo dài cưới hồng" },
  { time: "10:00", action: "Thu tiền", user: "Thanh Hà", detail: "3.500.000 đ - ĐT-2398" },
  { time: "11:30", action: "Nhận trả đồ", user: "Minh Anh", detail: "ĐT-2365 - Vest xám" },
  { time: "13:00", action: "Ghi nhận giặt", user: "Thanh Hà", detail: "5 bộ chuyển giặt" },
];

export const debtAlerts = [
  { customer: "Hoàng Văn Nam", amount: 3_000_000, daysOverdue: 12, orderId: "ĐT-2345" },
  { customer: "Nguyễn Thị Bích", amount: 5_200_000, daysOverdue: 8, orderId: "ĐT-2356" },
  { customer: "Trần Quốc Bảo", amount: 1_800_000, daysOverdue: 5, orderId: "ĐT-2367" },
];
