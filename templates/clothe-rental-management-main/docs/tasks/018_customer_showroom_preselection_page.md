# Task 018 - Customer Showroom Page (Public Catalog + Pre-selection)

## Mục tiêu
- Implement trang showroom cho khách xem/chọn sản phẩm (quần áo) trước khi đến shop thử đồ.
- Tách rõ page này với dashboard admin: đây là route customer-facing/read-mostly, không phải module quản trị.

## Phụ thuộc
- `docs/tasks/004_locale_routing_app_shell.md` (locale routing nền tảng)
- `docs/tasks/005_shared_ui_and_domain_primitives.md`
- `docs/tasks/006_products_catalog_module.md`
- `docs/tasks/016_settings_users_roles_general.md` (nếu muốn admin config/template selection UI dùng thật ngay trong MVP)

## Tài liệu tham chiếu
- `docs/000_Business_requests.md` (Sections 1.1, 1.2, 3.1, 4.2.3, 8.2)
- `docs/001_wireframe.md` (Sections 6.3, 11.2)

## Prompt gợi ý cho Codex
```text
Mục tiêu: xây trang showroom cho khách (public/customer-facing) để xem product catalog và chọn trước danh sách đồ muốn thử trước khi đến shop.

Yêu cầu:
1) Routes (locale-aware, ngoài admin dashboard shell):
   - /[locale]/showroom
   - /[locale]/showroom/[productId] (hoặc slug nếu đã có)
2) Showroom list page:
   - grid/list product cards (cover, name, category/tag, giá tham khảo, thuộc tính chính)
   - filters/search cơ bản: category/tag/gender/size/color/text
   - pagination hoặc load more
3) Product detail page (customer view):
   - gallery/cover
   - mô tả, size chart, color/variant options (read-only)
   - giá tham khảo / deposit reference (nếu policy cho phép hiển thị)
   - CTA add to shortlist (pre-selection)
4) Shortlist (MVP):
   - lưu local/session (anonymous-friendly)
   - thêm/xóa sản phẩm khỏi danh sách chọn trước
   - không tạo order, không lock item/date-range, không tạo payment
5) Data/API rules:
   - chỉ expose products public/showroom-visible (MVP có thể dùng `is_active && !is_archived`)
   - không expose fields nội bộ (internal notes, audit, cost, item-level nhạy cảm)
   - read-only endpoints/queries cho customer page
   - đọc showroom page config/template selection đã publish (nếu đã có config trong DB); fallback template/config mặc định nếu chưa có
   - ưu tiên đọc qua server layer/API (lọc `published`, tránh expose draft/admin config trực tiếp qua anon Data API)
6) Template rendering strategy (future-proof):
   - tạo renderer registry cho showroom `page_key=PRODUCT_HOME`
   - MVP chỉ implement `1` template thật (`PRODUCT_HOME_V1`)
   - vẫn giữ contract để sau này thêm template mới mà không phải đập lại data model
7) UX/performance:
   - mobile-first (khách thường dùng mobile)
   - loading/empty/error states
   - ảnh tối ưu hợp lý
8) Kiến trúc:
   - Component -> Hook -> Query -> Service -> API/Supabase
   - không gọi Supabase trực tiếp trong component

Không làm checkout online / online payment / inventory lock trong task này.
```

## Config cần chuẩn bị trước khi chạy task
- Route strategy:
  - public route `/[locale]/showroom` (khuyến nghị)
  - hoặc `/showroom` + locale optional (nếu chưa xong locale routing)
- Product visibility policy cho showroom page MVP:
  - `is_active = true` và `is_archived = false` (khuyến nghị nếu chưa có field riêng)
  - hoặc thêm field `is_showroom_visible` (nếu quyết định mở rộng schema)
- Showroom page config source:
  - đọc từ `showroom_page_configs` + `showroom_page_templates` (khuyến nghị)
  - chỉ dùng config `is_published = true` cho public page
  - fallback hardcoded config nếu task settings chưa xong
- Shortlist storage:
  - localStorage (khuyến nghị MVP)
  - sessionStorage
  - server-side shortlist (phase sau)
- Có hiển thị giá cọc/giá thuê đầy đủ cho khách không
- Có hiển thị availability summary không:
  - không hiển thị (đơn giản nhất)
  - hiển thị “tham khảo” (không lock)
- Template MVP code:
  - `PRODUCT_HOME_V1` (khuyến nghị)
- Fallback behavior:
  - nếu config/template chưa publish hoặc lỗi -> dùng default template v1 + config tối thiểu

## In-scope
- Showroom page list/detail cho khách (public/customer-facing)
- Shortlist/pre-selection local flow
- Read-only data contracts từ products catalog
- Render customer showroom page theo selected template/config (MVP chỉ 1 template thật)

## Out-of-scope
- Tạo order/booking trực tiếp từ khách
- Payment/checkout online
- Lock inventory/date-range từ showroom page
- CRM lead automation (Zalo/Email) từ shortlist

## Deliverables mong muốn
- Route showroom khách usable trên mobile/desktop
- Product browsing + filter/search hoạt động
- Shortlist local hoạt động, không đụng order/payment flows nội bộ
- Template renderer v1 hoạt động và đọc được config đã publish (hoặc fallback rõ ràng)

## Done criteria (coding)
- Guest (không login) xem được showroom page
- Chỉ hiện product hợp lệ theo visibility policy đã chốt
- Add/remove shortlist hoạt động và giữ state sau reload (nếu dùng localStorage)
- Không expose field nội bộ trong payload/UI customer page
- Không có logic tạo lock/payment/order từ customer page
- Nếu DB có `showroom_page_configs/templates`: page đọc đúng template/config đã chọn; nếu chỉ có 1 template thì vẫn qua renderer registry contract
- Public page không đọc draft/unpublished config

## Nhắc test nhanh
- Manual mobile/desktop browse showroom list/detail
- Manual filter/search + shortlist add/remove + reload persistence
- Manual đổi config/template từ admin settings (nếu task 016 đã có) -> kiểm tra showroom page phản ánh đúng
- Kiểm tra payload/API customer page không lộ field nội bộ
- Lint/typecheck module showroom customer pages

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \\[ \\] 018 |- [x] 018 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 018
  - Task file: docs/tasks/018_customer_showroom_preselection_page.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
