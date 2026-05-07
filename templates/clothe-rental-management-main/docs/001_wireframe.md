# Wireframe / Screen Spec — Website Quản Lý Showroom Thuê Quần Áo (Next.js + Supabase)

> **Phiên bản:** v1.1 (align với source base hiện tại)  
> **Ngôn ngữ UI:** Mục tiêu VI/EN; **source base hiện tại** đã có i18n provider nhưng **chưa dùng locale routing** `/[locale]/...`  
> **Đối tượng:** BA/PO/Designer/Dev (Admin dashboard)  
> **Ghi chú:** Wireframe dạng text + spec chi tiết (field, validation, state, permission, interaction)

> **Source base hiện tại (apps/web) — đã có thật trong code**
> - Route web hiện có: `/`, `/auth`, `/auth/callback`, `/api/auth/*`
> - `AuthGate` redirect: chưa có session -> `/auth`; đã có session (user/guest) vào `/auth` -> `/`
> - Chưa có dashboard/orders/inventory/products/... trong `apps/web/src/app`
> - Từ **Section 4 trở đi**, các route `/{locale}/...` được giữ nguyên như **route mục tiêu tương lai (wireframe/PRD)**, không phải current implementation

---

## 0) Quy ước chung

### 0.1 Breakpoints & layout
- Desktop-first (>= 1280px) cho dashboard.
- Tablet (>= 768px) giữ sidebar dạng collapse.
- Mobile (<= 767px) tối thiểu hỗ trợ xem/tra cứu; thao tác tạo đơn ưu tiên desktop/tablet.

### 0.2 UI patterns
- Danh sách dùng **table** + pagination + server-side filtering.
- Form dùng **drawer** (tạo nhanh) hoặc **page detail** (chỉnh sâu).
- Modal xác nhận cho hành động phá huỷ/không đảo ngược.
- Toast cho thành công/lỗi; inline error cho validation.
- Admin forms hỗ trợ `voice dictation` theo field được bật:
  - nút mic cạnh input/textarea (ưu tiên text/note fields)
  - trạng thái UI rõ ràng: idle / listening / processing / error / unsupported
  - không auto-submit form; user review/chỉnh lại trước khi lưu
  - fallback nhập tay nếu browser không hỗ trợ hoặc user từ chối microphone permission

### 0.3 i18n rules
- Không hard-code string; tất cả label/button/empty state/validation/toast lấy từ messages.
- Nội dung nghiệp vụ (tên sản phẩm, ghi chú) mặc định không dịch.
- **Source base hiện tại:** i18n chạy qua `I18nProvider` (client-side), chưa có locale routing `/[locale]/...`.
- Date/number format:
  - `vi`: dd/MM/yyyy, VND
  - `en`: MM/dd/yyyy (hoặc ISO tuỳ config), VND (hoặc currency theo setting nếu có)

### 0.4 Permission matrix (tóm tắt)
> **Lưu ý:** Đây là ma trận nghiệp vụ mục tiêu; source base hiện tại chưa implement RBAC cho các module quản trị showroom.

| Action | Staff | Manager | Owner/Admin |
|---|---:|---:|---:|
| Create order | ✅ | ✅ | ✅ |
| Edit order DRAFT/RESERVED | ✅ | ✅ | ✅ |
| Edit order CONFIRMED+ | ❌ | ✅ (audit) | ✅ (audit) |
| Cancel order | ❌ | ✅ | ✅ |
| Refund deposit | ❌ (tuỳ policy) | ✅ | ✅ |
| Edit product pricing | ❌ | ✅ | ✅ |
| Manage users/settings | ❌ | ❌/tuỳ | ✅ |

---

## 1) App Shell (Layout)

### 1.1 Global layout
**Route (target):** `/{locale}/(dashboard)/*`  
**Current source base:** `/` (temporary home/session panel), `/auth`, `/auth/callback`

**Structure**
- Left sidebar (nav)
- Topbar (search/global actions)
- Main content (page)
- Right optional panel (context help) — phase 2

**Current source base (implemented)**
- `src/app/layout.tsx`: root layout + container
- `src/app/providers.tsx`: `QueryClientProvider` + `I18nProvider` + `AuthGate`
- Chưa có dashboard shell/sidebar/topbar

**Sidebar nav items**
- Dashboard
- Orders
- Inventory
- Products
- Customers
- Payments
- Calendar
- Reports
- Settings

**Topbar**
- Branch selector (nếu multi-branch)
- Global search (orders/items/customers)
- Locale switch: `VI | EN`
- User menu: profile, logout

**Global states**
- Loading skeleton
- Error boundary (friendly message + retry)
- Offline banner (nếu offline-first later)

---

## 2) Auth Screens

### 2.1 Login
**Route (target):** `/{locale}/login`  
**Current source base:** `/auth`

**Wireframe**
- Logo + Title
- Email
- Password
- Button Login
- Link: Forgot password
- Optional: Magic link (phase 2)
- **Current source base thêm trong cùng màn `/auth`:**
  - Google OAuth sign-in
  - Guest/anonymous sign-in
  - Password reset request / reset confirm (state-based, không tách route)

**Fields**
- Email (required, format)
- Password (required, min 8)

**Validation**
- Email invalid → inline error
- Wrong credentials → toast + inline summary

**Success**
- **Current source base:** redirect `/` (temporary session/home panel)
- **Target tương lai:** redirect `/{locale}/dashboard`

**i18n**
- **Current source base (đang dùng):** nhóm key dạng `auth.*` (ví dụ `auth.title`, `auth.email`, `auth.password`, `auth.signIn`, `auth.forgotPassword`)
- **Target có thể chuẩn hoá thêm:** `auth.login.title`, `auth.login.cta`, ...

### 2.1.1 OAuth Callback (đã có trong source base)
**Route (current):** `/auth/callback`

**Purpose**
- Hoàn tất `exchangeCodeForSession` / `setSession` sau OAuth
- Post message về popup opener (nếu login popup)
- Redirect về `/`

---

### 2.2 Forgot password (optional phase 1)
**Route (target):** `/{locale}/forgot-password`  
**Current source base:** chưa tách route riêng; dùng state reset trong màn `/auth`

---

## 3) Dashboard (Overview)

### 3.1 Dashboard
**Route (target):** `/{locale}/dashboard`  
**Current source base:** `/` (temporary session panel để test auth state, chưa phải dashboard nghiệp vụ)

> **Status hiện tại:** Chưa implement dashboard nghiệp vụ (KPI/table/chart). Phần spec dưới đây giữ nguyên làm mục tiêu phát triển.

**Wireframe**
- Row 1: KPI cards
  - Revenue today
  - Orders on rent
  - Due today
  - Items in laundry
- Row 2:
  - Table: Due today (Orders)
  - Table: Overdue (Orders)
- Row 3:
  - Chart: Revenue last 7 days (optional phase 1)
  - List: Recent activities (status changes)

**KPI Cards**
- Revenue today = sum(payments `status=POSTED`, exclude `VOIDED`) theo ngày (filter branch)
- Orders on rent = count orders status PICKED_UP
- Due today = orders end_date = today and not RETURNED/COMPLETED
- Laundry items = items status LAUNDRY

**Actions**
- CTA “Create Order”
- Row tables: quick action “Open”, “Return” (nếu đủ quyền)

**Empty states**
- No due orders → “Không có đơn đến hạn hôm nay”
- No activities → “Chưa có hoạt động gần đây”

---

## 4) Orders Module

> **Ghi chú scope/source base:** Từ section này trở đi là **wireframe mục tiêu tương lai**.  
> `apps/web` hiện chưa có route/module thực thi cho Orders / Inventory / Products / Customers / Payments / Calendar / Reports / Settings.

## 4.1 Orders List

**Route:** `/{locale}/orders`

**Primary goal:** tra cứu, filter, thao tác trạng thái nhanh.

**Wireframe**
- Header: Title + CTA “Create Order”
- Filter bar (sticky):
  - Status dropdown (multi-select)
  - Date range (start/end)
  - Customer search (typeahead)
  - Staff (optional)
  - Payment status (optional, manual statuses như `POSTED` / `VOIDED`)
  - Reset filters
- Table:
  - Order code
  - Customer
  - Start date
  - End date
  - Status
  - Total
  - Deposit
  - Balance (optional)
  - Updated at
  - Actions (⋯)
- Pagination

**Table interactions**
- Click row → Order Detail
- Actions menu:
  - View detail
  - Confirm (if DRAFT/RESERVED)
  - Pick up (if CONFIRMED)
  - Return (if PICKED_UP)
  - Cancel (if Manager+)
  - Print/Export (phase 2)

**Status badges**
- DRAFT/RESERVED/CONFIRMED/PICKED_UP/RETURNED/COMPLETED/CANCELLED

**Validation / guards**
- Confirm requires at least 1 item.
- Pick up requires payment conditions (configurable):
  - Option A (default): require deposit collected > 0
  - Option B: allow pick up without deposit (flag warning)

**Empty states**
- No results → show empty + “Clear filters”

---

## 4.2 Create Order (Drawer or Page)

**Route:** `/{locale}/orders/new` (page)  
**Alt:** Drawer from list

**Wireframe (Page)**
- Stepper (top):
  1) Customer
  2) Rental period
  3) Items
  4) Pricing & Payment
  5) Review
- Right summary panel (sticky):
  - Rent subtotal
  - Discount
  - Fees (0)
  - Deposit
  - Total
  - Paid
  - Balance

### Step 1: Customer
**Components**
- Customer select (typeahead by phone/name)
- Button “Create new customer”
- Fields (if create inline):
  - Full name (required)
  - Phone (required)
  - Social link (optional)
  - Note (optional)

**Validation**
- Phone unique? (soft): if phone exists → suggest existing.
- Phone format (VN default): 10–11 digits; allow `+84` optional.

**Voice input (optional MVP)**
- Hỗ trợ dictation cho `Full name` và `Note` khi tạo customer inline.
- `Phone` nếu cho phép voice thì phải normalize + user review trước khi save.

### Step 2: Rental period
**Fields**
- Start date (required)
- End date (required, >= start date)
- Pickup time (optional)
- Return time (optional)

**Rules**
- Date range used to compute availability.
- End date inclusive/exclusive must be consistent:
  - Recommended: store as date range `[start, end]` inclusive, or use daterange with end exclusive. UI must clarify.
- Show warning for long rentals beyond threshold (config).

### Step 3: Items selection
**Wireframe**
- Search bar + filters:
  - Category, Size, Color, Status (Ready only)
- List/Grid of variants and items
- “Add” button per item
- Selected items panel:
  - Item code
  - Variant info
  - Remove

**Availability logic**
- Only show items that:
  - status in {READY} (optionally include LAUNDRY if “available by date” is predictable — phase 2)
  - not reserved/overlap in `reservation_windows` for chosen date range
- If user changes date range after selecting items:
  - re-validate; if conflict → mark item as invalid + force remove or choose another.

**Validation**
- Min 1 item.

### Step 4: Pricing & Payment
**Fields**
- Pricing per item:
  - Rent plan dropdown (1-day/3-day/7-day/custom per day)
  - Rent price (editable if Manager+)
- Discount (optional)
  - Amount or percent (choose one)
- Deposit
  - Auto (default per item/variant/product)
  - Override deposit (Manager+)
- Payment capture (optional at create):
  - Payment type: RENT / DEPOSIT
  - Method: CASH / BANK / MOMO (manual)
  - Amount
  - Note
  - Add payment (can add multiple)
  - Payment status xử lý thủ công phase 1 (không gateway callback); nếu hiển thị ở wizard thì dùng default `POSTED`, thay đổi status làm ở Payments module/Order Detail bởi Admin

**Calculations**
- Rent subtotal = sum(item rent)
- Total = rent subtotal - discount + fees (0 at create)
- Paid = sum(payments recorded)
- Balance = Total + Deposit - Paid (tuỳ policy: deposit tracked separate)
  - Recommended display both:
    - Deposit required / deposit paid
    - Rent total / rent paid

**Voice input (optional MVP)**
- Hỗ trợ dictation cho `Payment Note`, `Order Note`, `Internal Note`.
- Field số (`Amount`, `Deposit`, `Discount`) không auto-commit từ voice parse trong MVP.

**Validation**
- Discount cannot exceed rent subtotal.
- Deposit cannot be negative.
- Payment amount > 0.

### Step 5: Review
- Display order summary:
  - Customer
  - Date range
  - Items
  - Pricing
  - Deposit
  - Payments
- Submit buttons:
  - Save as DRAFT
  - Reserve (RESERVED)
  - Confirm (CONFIRMED)

**Success**
- Redirect to Order Detail.

---

## 4.3 Order Detail

**Route:** `/{locale}/orders/{orderId}`

**Wireframe**
- Header:
  - Order code + status badge
  - Quick actions (right):
    - Edit (role-based)
    - Confirm / Pick up / Return / Complete
    - Cancel
- Tabs:
  1) Summary
  2) Items
  3) Payments
  4) Incidents
  5) Activity (audit log)

### Tab 1: Summary
- Customer card (name/phone + link)
- Rental period card
- Pricing summary:
  - Rent subtotal
  - Discount
  - Fees
  - Deposit required/paid/refunded
  - Total
- Notes (internal)
- Timeline (status change timestamps)

### Tab 2: Items
**Table columns**
- Item code (QR icon)
- Product / Variant
- Status
- Rent price
- Deposit share (optional)
- Condition note (optional)
- Actions (remove/add only if DRAFT/RESERVED)

**Actions**
- Add item (only pre-pickup)
- Replace item (swap) (phase 2):
  - select another available item, keep price

### Tab 3: Payments
**List**
- Date/time
- Type (Rent/Deposit/Fee/Refund)
- Method
- Status (manual, MVP: `POSTED` / `VOIDED`)
- Amount
- Created by
- Note
- Actions:
  - Admin: cập nhật trạng thái payment thủ công (ví dụ `POSTED -> VOIDED`) + audit bắt buộc
  - Manager+: edit/delete payment (nếu policy cho phép, khuyến nghị restrict hoặc `void + new record`)

**Add payment**
- Same fields as create step.
- Validation: refund amount <= refundable deposit.
- Ghi chú: MVP không có online payment callback; payment/refund đều là thao tác nhập tay.

### Tab 4: Incidents
**Purpose:** xử lý hư/mất/bẩn nặng/trễ hạn.

**Incident form**
- Item (required)
- Type: LATE / DAMAGE / LOST / CLEANING
- Amount (required)
- Apply to deposit? (checkbox, default true)
- Description (optional)
- Attach photos (phase 2, Supabase Storage)
- Save

**Display**
- List incidents by item + total fees
- Button “Settle & Complete” (when RETURNED)

### Tab 5: Activity (Audit log)
- Order status changes
- Item changes (add/remove/swap)
- Payment changes
- Who/when/metadata

---

## 4.4 Pick Up (Check-out) Flow

**Entry points**
- Orders list action “Pick up”
- Order detail action “Pick up”

**Wireframe (Modal/Sheet)**
- Confirm checklist:
  - Items list + verify physical
  - Deposit status (collected?) + capture payment
  - Customer signature (phase 2)
- Button: Confirm pick up

**Rules**
- When pick up:
  - Order status → PICKED_UP
  - Each item status → ON_RENT
  - Create reservation window lock (if not already)

**Errors**
- Item becomes unavailable due to race condition → show conflict and block.

---

## 4.5 Return Flow (Check-in)

**Entry points**
- Orders list action “Return”
- Order detail action “Return”

**Wireframe (Wizard modal)**
1) Items condition checklist
   - For each item:
     - Condition: OK / NEED_CLEAN / DAMAGE / LOST
     - Note
2) Fees
   - Auto compute late fee if now > end_date
   - Add custom fees
3) Deposit settlement
   - Refund amount (auto = deposit - fees applied)
   - Option: refund via cash/bank
4) Confirm return

**Rules**
- On return:
  - Order status → RETURNED
  - Items:
    - OK → LAUNDRY (default) or READY (if you don’t track laundry)
    - DAMAGE → MAINTENANCE or DAMAGED
    - LOST → LOST
- After settlement/refund, action “Complete order” → COMPLETED

**Validation**
- Refund cannot exceed deposit paid.
- Lost item requires incident record.

---

## 5) Inventory Module

## 5.1 Inventory List (Items)

**Route:** `/{locale}/inventory`

**Wireframe**
- Header: Title + CTA “Add Item”
- Filter bar:
  - Status
  - Category
  - Size
  - Branch
  - Search by code
- Table:
  - QR/Code
  - Product/Variant
  - Status
  - Current order (if ON_RENT)
  - Last movement
  - Actions (⋯)

**Actions**
- View item detail
- Change status (role-based)
- Move branch (Manager+) (phase 2)
- Retire item

**Empty states**
- No items → CTA create product/item

---

## 5.2 Item Detail

**Route:** `/{locale}/inventory/{itemId}`

**Wireframe**
- Header: Item code + status badge + actions
- Sections:
  - Product info (images, variant attributes)
  - Current state (on rent? order link)
  - Status timeline (logs)
  - Rental history (orders list)
  - Notes + maintenance history (phase 2)

**Actions**
- Change status:
  - READY ↔ LAUNDRY ↔ MAINTENANCE
  - Mark damaged/lost (Manager+)
- Print QR (phase 2)

**Validation**
- Cannot set READY if item linked to active reservation window overlapping.

---

## 5.3 Quick Scan (QR)

**Route:** `/{locale}/inventory/scan` (optional phase 1)

**Wireframe**
- Camera scan (web) or input code
- On scan success:
  - Navigate to Item detail
  - Or open quick action sheet (Change status / Link to order)

---

## 6) Products Module

## 6.1 Products List

**Route:** `/{locale}/products`

**Wireframe**
- Header: Title + CTA “Create Product”
- Filters:
  - Category
  - Tag
  - Availability (has READY items)
- Table/Grid:
  - Cover image
  - Name
  - Category
  - Price policy
  - Total items / Ready items
  - Actions

**Actions**
- View detail
- Edit
- Archive (phase 2)

---

## 6.2 Product Detail

**Route:** `/{locale}/products/{productId}`

**Wireframe**
- Header: Product name + actions
- Tabs:
  1) Overview
  2) Variants
  3) Items
  4) Pricing
  5) Activity

### Overview
- Images gallery (upload to Storage)
- Fields:
  - Product name (required)
  - Category (required)
  - Tags (optional)
  - Material (optional)
  - Description (optional)
- Voice input (optional MVP): hỗ trợ `Product name`, `Material`, `Description` (text fields; user review trước khi save).

### Variants
- Table:
  - Variant name (size/color)
  - SKU code (optional)
  - Default deposit
  - Default price plan
  - Actions: add/edit/delete
- Voice input (optional MVP): hỗ trợ `Variant name`, `SKU code`; numeric pricing/deposit vẫn nhập tay hoặc xác nhận parse riêng.

### Items
- Table:
  - Item code
  - Status
  - Branch
  - Last rent date
  - Actions: create item, update status, retire

### Pricing
- Price plans:
  - 1 day price
  - 3 days price
  - 7 days price
  - Per-day price
- Override rules per variant
- Permission: only Manager+

**Validation**
- Product name unique within branch? (soft)
- Numeric values >= 0

---

## 6.3 Customer Showroom Product Home (Public / Pre-selection)

**Route:** `/{locale}/showroom` (target); current source base chưa implement

**Wireframe (MVP template `PRODUCT_HOME_V1`)**
- Hero section:
  - Title / subtitle (đọc từ `showroom_page_configs`)
  - Search box (optional toggle từ config)
  - CTA mở shortlist
- Filter bar:
  - Category
  - Tag
  - Gender
  - Size / Color
  - Text search
- Product grid:
  - Cover image
  - Product name
  - Category / tags
  - Price reference (nếu bật trong config)
  - Deposit reference (nếu bật trong config)
  - CTA `Add to shortlist`
- Optional sections (theo `sections_config_json`):
  - Featured products
  - Category grid
  - Text block / banner
- Footer CTA:
  - Hướng dẫn khách mang shortlist tới shop để thử đồ

**Template / config rules**
- Admin settings chọn template cho `PRODUCT_HOME` và publish config theo `branch + locale`.
- MVP chỉ render `1` template thật: `PRODUCT_HOME_V1`.
- UI renderer vẫn đi qua registry/selection contract để sau này thêm template mới không đổi data model.
- Nếu config chưa publish hoặc lỗi đọc config:
  - fallback về default `PRODUCT_HOME_V1` + config tối thiểu.

**Data safety**
- Không hiển thị field nội bộ (audit/internal note/cost/item-level nhạy cảm).
- Không tạo order/payment/lock từ trang này (chỉ pre-selection shortlist).

---

## 7) Customers Module

## 7.1 Customers List

**Route:** `/{locale}/customers`

**Wireframe**
- Header: Title + CTA “Create Customer”
- Search: name/phone
- Filters: tag (VIP/blacklist)
- Table:
  - Name
  - Phone
  - Total orders
  - Total spent
  - Last order date
  - Tags
  - Actions

**Actions**
- View detail
- Edit
- Add note

---

## 7.2 Customer Detail

**Route:** `/{locale}/customers/{customerId}`

**Wireframe**
- Header: customer name + actions
- Sections:
  - Contact info
  - Tags (VIP/blacklist)
  - Notes
  - Orders history table (filter status)
  - Incidents summary
- Voice input (optional MVP): hỗ trợ `full name`, `address`, `note`; `phone` cần review/format lại trước khi lưu.

**Validation**
- Phone required, unique (strongly recommended).

---

## 8) Payments Module

## 8.1 Payments List

**Route:** `/{locale}/payments`

**Wireframe**
- Header: Title + Export CSV
- Filters:
  - Date range
  - Type
  - Method
  - Branch
- Table:
  - Created at
  - Order code (link)
  - Customer
  - Type
  - Method
  - Status (manual)
  - Amount
  - Created by
  - Note

**Totals**
- Sum by method (cash/bank/momo) trên payment hợp lệ (`POSTED`)
- Sum by type (rent/deposit/fee/refund) trên payment hợp lệ (`POSTED`)

**Permissions**
- Staff: view own branch
- Manager+: export
- Admin: cập nhật trạng thái payment thủ công (`POSTED` / `VOIDED`) + audit

---

## 9) Calendar Module

## 9.1 Calendar View

**Route:** `/{locale}/calendar`

**Wireframe**
- Calendar (month/week/day toggle)
- Side panel filters:
  - Show: pickups, returns, bookings, overdue
- Clicking an event opens Order quick view.

**Event types**
- Pickup event: start_date
- Return event: end_date
- Booking event: reserved
- Overdue highlight: end_date < today & status PICKED_UP

---

## 10) Reports Module

## 10.1 Revenue Report

**Route:** `/{locale}/reports/revenue`

**Wireframe**
- Filters: date range, branch
- KPI:
  - Total revenue
  - Total deposit collected
  - Total refunds
  - Net (revenue - refunds)
- Ghi chú tính toán: dùng payment records hợp lệ (`status=POSTED`), loại trừ `VOIDED`.
- Chart (optional)
- Table by day

**Export**
- CSV

---

## 10.2 Utilization Report

**Route:** `/{locale}/reports/utilization`

**Wireframe**
- KPI: % items ON_RENT
- Table by category/product

---

## 10.3 Incidents Report

**Route:** `/{locale}/reports/incidents`

**Wireframe**
- Filters: date range, incident type
- Table: item, order, customer, type, amount

---

## 11) Settings Module

## 11.1 General Settings

**Route:** `/{locale}/settings/general`

**Fields**
- Default locale (system) — default `vi`
- Currency — default VND
- Late fee policy:
  - per day fixed
  - percent per day
- Laundry tracking toggle:
  - If off: returned items go READY directly

**Permissions**
- Owner/Admin only

---

## 11.2 Showroom Pages (Customer Product Home Config)

**Route:** `/{locale}/settings/showroom-pages` (hoặc tab trong General Settings ở MVP)

**Scope**
- Admin page điều khiển thông tin hiển thị trên customer showroom product home page.
- Quản lý theo `branch + locale + page_key=PRODUCT_HOME`.

**Wireframe**
- Header:
  - Page key (`PRODUCT_HOME`)
  - Branch selector (nếu multi-branch)
  - Locale selector (`vi` / `en`)
  - Status badge (`Draft` / `Published`)
  - Actions: `Save draft`, `Publish`, `Unpublish`, `Preview`
- Template section:
  - Template selector (load từ `showroom_page_templates`)
  - Template preview thumbnail (optional)
  - Template version
  - Note: MVP chỉ có `PRODUCT_HOME_V1`, nhưng selector vẫn hiển thị contract nhiều template
- Content sections config:
  - Hero title / subtitle
  - Hero image
  - Section order (drag/drop hoặc up/down)
  - Toggle sections (hero / featured / category grid / text blocks)
  - Filter options toggle (category/tag/gender/size/color/text)
  - Display toggles (show price reference / deposit reference / shortlist CTA)
- SEO config (optional MVP):
  - Page title
  - Meta description
- Voice input (MVP khuyến nghị):
  - Hero title / subtitle
  - Text block content
  - SEO title / meta description

**Permissions**
- Owner/Admin only (khuyến nghị MVP: chỉ Admin thao tác publish/template selection)

**Notes**
- Customer showroom page chỉ đọc config đã `published`.
- Draft config không được render ra public page nếu chưa publish.

---

## 11.3 Branches (optional nếu multi-branch)

**Route:** `/{locale}/settings/branches`

- CRUD branches

---

## 11.4 Users & Roles

**Route:** `/{locale}/settings/users`

**Wireframe**
- Table:
  - Name
  - Email
  - Role
  - Branch
  - Status active
- Actions:
  - Invite user (Supabase Auth invite)
  - Change role
  - Disable user

**Validation**
- Role required
- Branch required for Staff/Manager

---

## 12) System Messages (i18n catalog tối thiểu)

> Mục tiêu: QA không thấy string “lọt”. Dưới đây là key groups cần có.

### 12.1 Navigation
- `nav.dashboard`, `nav.orders`, `nav.inventory`, `nav.products`, `nav.customers`, `nav.payments`, `nav.calendar`, `nav.reports`, `nav.settings`

### 12.2 Common
- `common.create`, `common.edit`, `common.save`, `common.cancel`, `common.delete`, `common.search`, `common.filter`, `common.export`, `common.confirm`, `common.back`, `common.next`
- Voice UI (nếu bật feature):
  - `common.voice.start`, `common.voice.stop`, `common.voice.retry`
  - `common.voice.listening`, `common.voice.processing`, `common.voice.unsupported`, `common.voice.permissionDenied`

### 12.3 Orders
- `orders.create.title`, `orders.fields.startDate`, `orders.fields.endDate`, `orders.fields.deposit`, `orders.fields.discount`, `orders.actions.pickup`, `orders.actions.return`, `orders.actions.complete`
- `orders.status.draft`, `orders.status.reserved`, `orders.status.confirmed`, `orders.status.pickedUp`, `orders.status.returned`, `orders.status.completed`, `orders.status.cancelled`

### 12.4 Inventory
- `items.status.ready`, `items.status.reserved`, `items.status.onRent`, `items.status.laundry`, `items.status.maintenance`, `items.status.damaged`, `items.status.lost`, `items.status.retired`

### 12.5 Validation & Toast
- `validation.required`, `validation.invalidEmail`, `validation.invalidPhone`, `validation.invalidDateRange`, `validation.itemNotAvailable`
- `toast.created`, `toast.updated`, `toast.paymentRecorded`, `toast.refundProcessed`, `toast.errorGeneric`

---

## 13) QA Checklist theo màn (gợi ý)

- Orders:
  - tạo đơn với item unavailable → blocked
  - đổi date range → revalidate items
  - pick up tạo ON_RENT + lock window
  - return tạo incidents + fees + refund đúng
- Inventory:
  - change status invalid transitions blocked
- i18n:
  - chuyển locale không mất state form
  - key coverage 100% trong MVP pages

---

## 14) Deliverables UI (gợi ý cho Designer)
- Design system: typography, spacing, buttons, badges
- Components: Table, FilterBar, Drawer, Stepper, StatusBadge, MoneyInput, DateRangePicker, CustomerTypeahead, ItemPicker
- Empty states + error states
