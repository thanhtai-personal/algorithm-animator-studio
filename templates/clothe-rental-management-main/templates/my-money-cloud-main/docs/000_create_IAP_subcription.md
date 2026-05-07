# HƯỚNG DẪN TẠO SUBSCRIPTION IAP (GOOGLE PLAY CONSOLE)

## Mục tiêu
- App: **Free**
- Bán gói **Gỡ quảng cáo theo tháng**
- Loại: **Subscription – Auto-renew**
- Giá: **1 USD / tháng**
- Không dùng Offer (không khuyến mãi)

---

## I. ĐIỀU KIỆN TRƯỚC KHI BẮT ĐẦU

- App đã được tạo trên Google Play Console
- Đã upload **ít nhất 1 build** (Internal testing là đủ)
- App **KHÔNG cần** là Paid
- Đã liên kết **Payments profile**

---

## II. TẠO SUBSCRIPTION

### 1. Vào màn hình Subscriptions

Play Console  
→ Monetize with Play  
→ Products  
→ Subscriptions  
→ Create subscription  

### 2. Thông tin Subscription

- **Product ID**: `no_ads_monthly`
- **Name (default language)**: `No Ads Monthly`

⚠️ Product ID không thể đổi sau khi tạo

---

## III. TẠO BASE PLAN (BẮT BUỘC)

### 1. Add base plan

Subscriptions → no_ads_monthly → Add base plan

### 2. Cấu hình Base plan

- **Base plan ID**: `base-monthly`  
  (chỉ dùng chữ thường + số + dấu `-`, không dùng `_`)
- **Type**: Auto-renewing
- **Billing period**: Monthly
- **Price**: 1 USD
- **Grace period & Account hold**: Giữ mặc định
- **Resubscribe**: Allow

→ Save

### 3. Trạng thái cần đạt
- Base plan status: **Active**

---

## IV. OFFER – CÓ CẦN KHÔNG?

### Kết luận
👉 **KHÔNG CẦN OFFER** cho gói giá chuẩn.

### Giải thích
- Offer là ưu đãi, bắt buộc rẻ hơn Base plan
- Giá bằng nhau sẽ bị Google báo lỗi

---

## V. CẤU TRÚC CUỐI CÙNG ĐÚNG CHUẨN

Subscription ID : no_ads_monthly  
Base plan ID   : base-monthly  
Price          : 1 USD / month  
Offer          : Không có  
Status         : Active  

---

## VI. CHECKLIST XÁC NHẬN

- Subscription tồn tại
- Base plan Active
- Không lỗi pricing theo quốc gia
- App Free

➡️ **Subscription sẵn sàng để mua**

---

## VII. TEST SUBSCRIPTION

- App ở Internal testing
- Tài khoản là tester

Test:
1. Mở app
2. Chọn No Ads Monthly
3. Thanh toán
4. Ads tắt

---

## VIII. LƯU Ý QUAN TRỌNG

- Không đổi app Free → Paid
- Không tạo Offer nếu không giảm giá
- Không dùng `_` trong Base plan ID
- Subscription mua trực tiếp bằng Base plan

---

## IX. TÍCH HỢP TRONG CODE (TÓM TẮT)

- productId = `no_ads_monthly`
- Không cần offerToken
- acknowledgePurchase
- Hết hạn → bật lại ads

---

## KẾT LUẬN

Subscription gỡ quảng cáo giá chuẩn → **chỉ cần Base plan, không cần Offer**
