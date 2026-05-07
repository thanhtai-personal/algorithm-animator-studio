# Task 089 - Cho phép chọn nhiều ảnh một lần cho các field hỗ trợ nhiều ảnh (ưu tiên Product gallery images)

## Mục tiêu
- Cho phép người dùng chọn nhiều media trong một lần mở media picker đối với các field đã hỗ trợ nhiều URL.
- Ưu tiên áp dụng cho `gallery images` của product (ví dụ ảnh phụ sản phẩm), sau đó áp dụng cùng pattern cho các field multi-media tương tự.
- Giảm thao tác lặp mở modal/chọn từng ảnh một, nhưng vẫn giữ nguyên hành vi single-select cho các field chỉ nhận một giá trị.

## Phụ thuộc
- `docs/tasks/043_media_management_dashboard_and_product_picker.md`
- `docs/tasks/073_component_refactor_split_large_components_and_extract_utils_constants.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/000_architecture_index.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/tasks/000_task_structure_standard.md`
- `apps/web/src/features/media/views/MediaPickerModal/MediaPickerModal.tsx`
- `apps/web/src/features/media/hooks/useMediaPickerModal.ts`
- `apps/web/src/features/products/views/ProductOverviewForm/ProductOverviewForm.tsx`

## Hiện trạng cần lưu ý
- `MediaPickerModal` hiện đóng ngay sau khi chọn 1 asset (`onSelectAsset` + `onOpenChange(false)`), phù hợp single-select nhưng chưa phù hợp field multi-image.
- Form product overview đang dùng text area nhiều dòng cho `galleryImageUrlsText`/`videoUrlsText` và append từng URL mỗi lần chọn.
- Nhiều màn settings/products đang tái sử dụng cùng modal picker, nên cần giữ backward compatibility cho luồng chọn một ảnh.

## Config cần chuẩn bị trước khi chạy task
- Web:
  - `cd apps/web && npm run lint`
  - `cd apps/web && npm run typecheck`

## Architecture Impact
- Layers affected:
  - `Component`: `MediaPickerModal`, `ProductOverviewForm` (UI chọn nhiều ảnh).
  - `Hook`: `useMediaPickerModal` và hook/form model liên quan để quản trạng thái chọn nhiều asset.
  - `Query/Service`: không đổi API contract; tái sử dụng query media hiện tại.
- Domain affected:
  - Media management picker UX.
  - Product media editing (gallery/video URLs).
- App(s) affected: `apps/web`

## Current State vs Target State
- Current:
  - Modal media picker chỉ hỗ trợ chọn 1 asset/lần và tự đóng modal.
  - Field multi-image phải lặp thao tác chọn từng ảnh.
- Target (Architecture V2):
  - Media picker có mode multi-select cho field hỗ trợ nhiều ảnh/video.
  - Người dùng có thể tick nhiều asset rồi bấm action xác nhận một lần để chèn hàng loạt URL.
  - Mode single-select hiện hữu vẫn hoạt động cho field đơn (cover/logo/banner...).

## Boundary Rules
- Must keep:
  - Giữ flow `Component -> Hook -> Query -> Service -> API`.
  - Không đưa logic network xuống component.
  - Không đổi schema DB hay API contract nếu không thực sự cần.
  - Giữ tương thích với toàn bộ nơi đang dùng single-select.
- Forbidden:
  - Không tạo endpoint mới trong `apps/web/src/app/api/**`.
  - Không duplicate logic picker ở từng màn thay vì mở rộng shared modal/hook.
  - Không đổi semantics lưu dữ liệu product ngoài phạm vi chèn nhiều URL.

## Compatibility & Migration Strategy
- Compatibility window:
  - Hỗ trợ đồng thời `single-select` và `multi-select` trong cùng `MediaPickerModal`.
- Deprecation/removal plan:
  - Không deprecate flow cũ; chỉ mở rộng mode mới để caller chọn theo ngữ cảnh field.
- Rollback condition:
  - Nếu phát sinh lỗi chèn URL hàng loạt hoặc phá luồng single-select, rollback về single-select mặc định và tạm tắt multi mode bằng prop/config.

## In-scope
- Mở rộng `MediaPickerModal`:
  - Thêm mode chọn `single`/`multi`.
  - Multi mode có UI chọn nhiều item và nút xác nhận batch insert.
  - Không tự đóng modal ngay khi click 1 item trong multi mode.
- Mở rộng contract callback:
  - Hỗ trợ callback trả danh sách assets đã chọn cho multi mode.
  - Giữ callback single-select cho caller cũ.
- Áp dụng multi mode cho product form:
  - `gallery images` (bắt buộc).
  - `videos` nếu field đó cũng cho phép nhiều URL và dùng chung picker.
- Chuẩn hóa xử lý append URL:
  - Không duplicate URL đã tồn tại.
  - Giữ thứ tự insert ổn định theo thứ tự chọn.

## Out-of-scope
- Thay đổi media upload backend/storage/quota.
- Thay đổi permission media theo role.
- Refactor toàn bộ UI/UX media library ngoài phạm vi picker chọn asset.
- Áp dụng cho mobile/zalo trong task này.

## Deliverables mong muốn
- `MediaPickerModal` hỗ trợ đầy đủ single + multi mode.
- Product field `gallery images` chọn nhiều ảnh một lần thành công.
- Các nơi single-select hiện tại không bị regression.
- Có test checklist rõ cho dedupe URL và hành vi đóng/mở modal.

## Done criteria (coding)
- Caller có thể bật multi-select bằng prop/config rõ ràng.
- Product gallery insert được nhiều URL sau một lần xác nhận trong picker.
- Nếu chọn lại ảnh đã có, hệ thống không thêm duplicate line.
- Single-select flow (cover/logo/settings image) vẫn hoạt động như trước.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npm run lint` pass (hoặc ghi rõ baseline lỗi ngoài phạm vi nếu có).

## Done Criteria (Architecture)
- [ ] Không thêm business endpoint mới vào `apps/web/app/api`.
- [ ] Không thêm import ngược tầng hoặc shortcut cross-layer.
- [ ] Không duplicate business logic picker giữa nhiều feature.
- [ ] Không thêm truy cập Supabase DB ở runtime ngoài `apps/server`.
- [ ] Không thay đổi API contract backend nếu task chỉ thuộc UI picker behavior.
- [ ] Caller impacted list được cập nhật rõ (single-select callers vs multi-select callers).

## Regression Scope
- [ ] Product overview form: chọn nhiều ảnh cho `gallery images` và chèn đúng danh sách URL.
- [ ] Product overview form: chọn nhiều video (nếu bật multi cho videos) hoạt động đúng.
- [ ] Dedupe URL: không thêm trùng khi đã có URL trong text area.
- [ ] Single-select ở settings/products cover image vẫn tự đóng modal và gán đúng 1 URL.
- [ ] Search/filter/upload trong media picker không bị vỡ khi bật multi mode.
- [ ] Locale `vi/en` cho các label mới (select count/confirm action) hiển thị đúng.

## Nhắc test nhanh
- Manual:
  - Mở product form -> gallery -> chọn 3 ảnh -> xác nhận -> kiểm tra text area có đủ 3 URL.
  - Chọn lại 1 ảnh cũ + 1 ảnh mới -> chỉ thêm ảnh mới.
  - Mở flow cover image/settings image -> chọn 1 ảnh -> modal đóng như cũ.
- Command:
  - `cd apps/web && npm run typecheck`
  - `cd apps/web && npm run lint`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng `089` thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 088 /a - [ ] 089 | Media picker multi-select for multi-image fields (product gallery first) with single-select backward compatibility | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \\[ \\] 089 |- [x] 089 |" progress/tasks.md
  ~~~
- Append completion log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 089
  - Task file: docs/tasks/089_media_picker_multi_select_for_multi_image_fields.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
