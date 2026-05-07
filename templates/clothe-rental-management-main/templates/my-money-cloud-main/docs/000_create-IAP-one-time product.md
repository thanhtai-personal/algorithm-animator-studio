# HƯỚNG DẪN TẠO IN-APP PRODUCT (ONE-TIME) – NO ADS LIFETIME

## Mục tiêu
- App: **Free**
- Bán gói **Gỡ quảng cáo vĩnh viễn**
- Loại: **In-app product – Non-consumable**
- Giá: **10 USD (mua 1 lần, dùng vĩnh viễn)**

---

## I. ĐIỀU KIỆN BẮT BUỘC

- App đã upload **ít nhất 1 build** (Internal testing là đủ)
- Build **có Billing permission**  
  `com.android.vending.BILLING`
- Payments profile đã **Active**

---

## II. VÀO ĐÚNG MÀN HÌNH

```
Play Console
→ Monetize with Play
→ Products
→ One-time products
→ Create product
```

---

## III. TẠO PRODUCT `no_ads_lifetime`

### 1. Thông tin cơ bản

- **Product ID**:
  ```
  no_ads_lifetime
  ```
- **Name (default language)**:
  ```
  No Ads Lifetime
  ```
- **Product type**:
  ```
  Non-consumable
  ```

---

## IV. PURCHASE OPTION (BẮT BUỘC)

### 1. Purchase option ID
- ID nội bộ, user không thấy
- Chỉ dùng chữ thường, số, dấu `-`

**Khuyến nghị:**
```
buy
```

---

### 2. Purchase type
```
Buy
```
(Mua 1 lần, dùng vĩnh viễn)

---

### 3. Tags (không bắt buộc)
- Có thể để trống
- Hoặc:
```
lifetime
```

---

### 4. Advanced options
- Giữ mặc định
- Không cần chỉnh

---

## V. AVAILABILITY AND PRICING

### 1. Availability
```
All regions
```

---

### 2. Set prices
- Giá gốc:
```
10 USD
```
- Google tự động quy đổi giá cho từng quốc gia
- Không cần price override

---

## VI. ACTIVATE PRODUCT

- Bật trạng thái **Active**
- Đảm bảo không còn cảnh báo đỏ

---

## VII. CHECKLIST XÁC NHẬN

- [x] Product ID: `no_ads_lifetime`
- [x] Purchase option ID: `buy`
- [x] Type: Non-consumable
- [x] Price: 10 USD
- [x] Status: Active

➡️ **One-time product sẵn sàng để mua**

---

## VIII. LOGIC TRONG APP (BẮT BUỘC)

### Ưu tiên quyền lợi
```
Nếu user đã mua no_ads_lifetime
→ Tắt quảng cáo vĩnh viễn
→ Bỏ qua subscription

Nếu chưa mua lifetime nhưng có no_ads_monthly còn hiệu lực
→ Tắt quảng cáo theo tháng

Ngược lại
→ Hiển thị quảng cáo
```

---

## IX. RESTORE PURCHASE

- Khi user:
  - Đổi máy
  - Cài lại app
- App phải:
  - Query purchases
  - Phát hiện `no_ads_lifetime`
  - Khôi phục trạng thái **No Ads**

---

## X. TEST ONE-TIME PRODUCT

- App ở **Internal testing**
- Tài khoản Google là **tester**

Test:
1. Mua **No Ads Lifetime**
2. Xác nhận Ads tắt
3. Gỡ app → cài lại → Ads vẫn tắt

---

## KẾT LUẬN

> **No Ads Lifetime = In-app product (Non-consumable)**  
> → Mua 1 lần → dùng vĩnh viễn → cần restore purchase chuẩn.
