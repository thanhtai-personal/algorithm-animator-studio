# Hướng dẫn cài đặt & chạy source (Next.js)

## 1) Yêu cầu
- Node.js 18+ và npm
- Tài khoản Supabase

## 2) Cài dependencies
```bash
npm install
```

## 3) Cấu hình Supabase
Tạo project trên Supabase, sau đó thêm bảng `transactions` và bật RLS:

```sql
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  amount bigint not null,
  description text,
  category_id text not null,
  type text not null check (type in ('income', 'expense')),
  date timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "Users can view their transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert their transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their transactions"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);
```

Thêm bảng `categories` để lưu danh mục tuỳ chỉnh của người dùng:

```sql
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text,
  color text,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "Users can view their categories"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "Users can insert their categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update their categories"
  on public.categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their categories"
  on public.categories for delete
  using (auth.uid() = user_id);
```

Bật Email/Password trong Supabase Auth (Authentication → Providers):
1) Vào Supabase Dashboard → chọn project.
2) Mở **Authentication** → tab **Providers**.
3) Chọn **Email** và bật **Enable Email Provider**.
4) (Dev nhanh) Tắt **Confirm email** nếu muốn đăng ký xong đăng nhập ngay.
   - Nếu bật Confirm email: cần cấu hình SMTP ở **Authentication → SMTP** để email xác nhận được gửi.
5) (Tuỳ chọn) Trong **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000`
   - **Additional Redirect URLs**: thêm `http://localhost:3000` và domain production nếu có.

## 4) Tạo file môi trường
Tạo `.env.local` ở root dự án:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_ENABLED_EMAIL_SENDER=false
# optional server override (if set, this value has priority)
ENABLED_EMAIL_SENDER=false
```

## 5) Chạy ứng dụng
```bash
npm run dev
```

## Ghi chú OCR
Tính năng quét hóa đơn sử dụng `tesseract.js`, lần chạy đầu có thể mất vài giây để load mô hình OCR.

## Vite client cũ
Source Vite được giữ ở `Vite-cli/` nếu cần đối chiếu hoặc chạy song song.

---

# Hướng dẫn bật IAP (Mobile - gỡ quảng cáo)

## 1) Chuẩn bị tài khoản store
- **Google Play Console**:
  - Hoàn tất Payments profile + tax/banking.
  - App phải có package name đúng như `app.json` (`android.package`).
- **App Store Connect**:
  - Hoàn tất Agreements, Tax, Banking.
  - App phải có bundle id đúng như `app.json` (`ios.bundleIdentifier`).

## 2) Tạo sản phẩm IAP
- **Google Play Console**:
  - Monetize → Products → Subscriptions:
    - Tạo subscription `no_ads_monthly` (1$ / tháng).
    - Tạo base plan + offer (ít nhất 1 offer token).
  - Monetize → Products → In‑app products:
    - Tạo non‑consumable `no_ads_lifetime` (10$ vĩnh viễn).
- **App Store Connect**:
  - In‑App Purchases:
    - Tạo auto‑renewable subscription `no_ads_monthly`.
    - Tạo non‑consumable `no_ads_lifetime`.

## 3) Cài dependency (Native-cli)
```bash
cd Native-cli
npm install
```

## 4) Cấu hình app.json (Native-cli/app.json)
- Thêm quyền Android billing:
  - `com.android.vending.BILLING` trong `expo.android.permissions`
- Khai báo productId:
  - `extra.IAP_NO_ADS_MONTHLY`
  - `extra.IAP_NO_ADS_LIFETIME`
- Thêm plugin `react-native-iap` để fix flavor Android:
  - `paymentProvider: "Play Store"` (hoặc `"Amazon AppStore"` / `"both"` nếu cần)

Ví dụ cấu hình:
```json
{
  "expo": {
    "android": {
      "permissions": ["com.android.vending.BILLING"]
    },
    "plugins": [
      ["react-native-iap", { "paymentProvider": "Play Store" }]
    ],
    "extra": {
      "IAP_NO_ADS_MONTHLY": "no_ads_monthly",
      "IAP_NO_ADS_LIFETIME": "no_ads_lifetime"
    }
  }
}
```

## 5) Thiết lập test (khuyến nghị)
- **Google Play**:
  - Setup → License testing: thêm email tester.
  - Upload build vào Internal testing/Closed testing.
- **App Store**:
  - Users and Access → Sandbox Testers: tạo tester.
  - Upload build TestFlight, IAP ở trạng thái "Ready to Submit" hoặc cao hơn.

## 6) Build native
- Chạy `npx expo prebuild` nếu cần cập nhật native project.
- Build bằng EAS (development/production) như bình thường.

## 7) Lưu ý vận hành
- IAP chỉ test được trên build thật (không chạy Expo Go).
- Android subscription cần base plan/offer token; code đang lấy offer token đầu tiên.
- App Store có thể cần thời gian review IAP trước khi test đầy đủ.
- Khuyến nghị bổ sung verify receipt ở cloud nếu muốn chống gian lận/hoàn tiền.
