# 011 - Chuẩn Bắt Buộc Cho Task Theo Kiến Trúc Mới

## 1) Mục tiêu
Đảm bảo mọi task mới không phá kiến trúc V2 và có lộ trình migration rõ ràng.

Tài liệu này áp dụng cho:
- `docs/tasks/*.md`
- `docs/tasks/modules/**/*.md`

## 2) Task mới bắt buộc có các section sau

1. **Architecture Impact**
   - Task tác động layer nào (client/server/db/integration).
   - Domain nào bị ảnh hưởng.

2. **Current State vs Target State**
   - Nêu rõ trạng thái hiện tại.
   - Nêu rõ target theo kiến trúc V2.

3. **Boundary Rules**
   - Các boundary phải giữ nguyên (layering/import rules/ownership).

4. **Compatibility & Migration Strategy** (nếu có cutover)
   - Forwarding/deprecation window.
   - Rollback condition.

5. **Done Criteria (Architecture)**
   - Checklist bắt buộc cho compliance kiến trúc.

6. **Regression Scope**
   - Danh sách flow cần test bắt buộc.

7. **Progress Update Requirement**
   - Bắt buộc chỉ rõ file progress cần cập nhật.
   - Khi mark done, bắt buộc ghi `Token usage` vào completion log.

8. **Implementation Context (Token tối ưu)**
   - Chỉ rõ route/screen, entry component/hook/service chính.
   - Chỉ rõ file nên đọc/sửa trước, tối đa 3-6 file.
   - Chỉ rõ file/tài liệu chỉ đọc khi cần, tối đa 1-2 link.
   - Chỉ rõ boundary cần giữ và QA nhanh.
   - Mục tiêu: agent có thể bắt đầu đúng phạm vi mà không phải quét lại toàn repo.

## 3) Checklist compliance bắt buộc trong mỗi task
- [ ] Không thêm business endpoint mới vào `apps/web/app/api` nếu domain đã ở Nest.
- [ ] Không thêm import ngược tầng (UI -> server internals, controller -> repository skip service, ...).
- [ ] Không duplicate business rule ở 2 runtime.
- [ ] Không thêm truy cập Supabase DB ở runtime ngoài `apps/server`.
- [ ] Có contract parity khi migrate endpoint.
- [ ] Có danh sách callers bị ảnh hưởng và trạng thái cutover.
- [ ] Có quy định cập nhật progress kèm `Token usage`.
- [ ] Có `Implementation Context (Token tối ưu)` đủ route, entrypoint, file chính, boundary và QA nhanh.

## 4) Quy định riêng cho task API
- Với task API mới:
  - Ưu tiên tạo ở `apps/server`.
  - Chỉ `apps/server` được phép truy cập trực tiếp Supabase DB.
  - Nếu bắt buộc còn route web tạm thời, phải ghi rõ:
    - vì sao cần tạm thời,
    - khi nào xóa,
    - điều kiện xóa,
    - và xác nhận route tạm thời không query DB trực tiếp.

## 4.1 Quy định riêng cho task module trong `apps/server`
- Khi task thêm/sửa module backend:
  - phải chỉ rõ domain module nào bị ảnh hưởng;
  - phải chỉ rõ lớp nào bị thay đổi trong mô hình:
    - `presentation`,
    - `application`,
    - `domain`,
    - `infrastructure`;
  - nếu chưa tách đủ 4 lớp (do phase migration), phải nêu rõ kế hoạch chuẩn hóa tiếp theo.
- Chuẩn cấu trúc bắt buộc tham chiếu:
  - `docs/architecture/012_apps_server_source_structure_for_cms_admin.md`.

## 5) Quy định riêng cho task frontend
- Bắt buộc giữ flow:
  - `Component -> Hook -> Query -> Service -> API`
- Không gọi thẳng `fetch` trong component trừ trường hợp infra đặc biệt có nêu lý do.

## 6) Task review gate (trước khi mark done)
- [ ] Pass coding checks trong task.
- [ ] Pass checklist architecture compliance.
- [ ] Cập nhật docs liên quan nếu task làm thay đổi boundary/ownership.
- [ ] Cập nhật progress log nêu rõ `Known gaps`.
- [ ] Cập nhật progress log có trường `Token usage` (input/output/total hoặc total).
- [ ] Với task `apps/server`, xác nhận không có Supabase query nằm ngoài infrastructure/data-access layer của module.

## 7) Template block gợi ý để copy vào task mới
```md
## Architecture Impact
- Layers affected:
- Domain affected:

## Current State vs Target State
- Current:
- Target (Architecture V2):

## Boundary Rules
- Must keep:
- Forbidden:

## Compatibility & Migration Strategy
- Compatibility window:
- Rollback condition:

## Done Criteria (Architecture)
- [ ] ...
- [ ] ...

## Regression Scope
- [ ] ...
- [ ] ...

## Implementation Context (Token tối ưu)
- Route/screen:
- Entry component/hook/service:
- Đọc/sửa trước:
  - `apps/...`
- Chỉ đọc khi cần:
  - `docs/...`
- Boundary cần giữ:
- QA nhanh:

## Progress Update Requirement
- Progress file:
- Checklist item:
- Completion log bắt buộc có:
  - `Token usage: input=<n>, output=<n>, total=<n>` (hoặc `total=<n>` nếu hệ thống chỉ cung cấp tổng token)
```
