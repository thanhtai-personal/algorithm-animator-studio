# Task 084 - Admin Makeup Inventory: danh sách hàng makeup + link Shopee + mapping gói makeup/chuyên viên

## Input ban đầu
- Cần màn hình danh sách hàng makeup trong admin.
- Mỗi món hàng makeup:
  - có link Shopee,
  - thuộc về 1 gói makeup (danh mục makeup),
  - thuộc về 1 chuyên viên makeup.
- Danh mục bao gồm đồ dùng, phụ kiện, mỹ phẩm phục vụ trang điểm.

## Mục tiêu
- Xây tab `Inventory` cho module makeup để quản lý catalog hàng makeup.
- Chuẩn hóa data model phục vụ mapping:
  - item -> package,
  - item -> artist.
- Có field Shopee URL và validate an toàn đầu vào.

## Phụ thuộc
- `docs/tasks/modules/makeup/005_makeup_packages_setup_admin_and_artist.md`
- `docs/tasks/modules/makeup/008_makeup_admin_tabs_shell_and_default_calendar_route.md`

## Mapping màn hình/source
- UI:
  - `apps/web/src/app/[locale]/(dashboard)/makeup/inventory/page.tsx`
  - `apps/web/src/features/makeup/components/MakeupInventoryPage.tsx` (new)
  - `apps/web/src/features/makeup/hooks/useMakeupInventoryPage.ts` (new)
- Query/Service:
  - `apps/web/src/features/makeup/queries/useMakeupQueries.ts` (extend)
  - `apps/web/src/features/makeup/services/makeupClientService.ts` (extend)
- API:
  - `apps/web/src/app/api/makeup/inventory/route.ts` (new)
  - `apps/web/src/app/api/makeup/inventory/[itemId]/route.ts` (new)
  - `apps/web/src/server/services/makeupService.ts` (extend)
  - `apps/web/src/server/data-access/makeupInventory.ts` (new)
- Schema:
  - `apps/web/sql/035_makeup_inventory_items_core.sql` (new)
  - `apps/web/sql/README.md`
- Types:
  - `apps/web/src/types/makeupModule.ts` (extend inventory DTO/payload)

## Quy tắc nghiệp vụ bắt buộc
- Mỗi item makeup bắt buộc:
  - `packageId` (1 item thuộc đúng 1 gói),
  - `artistProfileId` (1 item thuộc đúng 1 chuyên viên).
- Shopee URL:
  - optional nhưng nếu có phải là URL hợp lệ.
  - chỉ cho phép domain `shopee.vn` hoặc subdomain shopee hợp lệ theo policy.
- Branch isolation:
  - item chỉ thao tác trong branch hiện tại.
- Trạng thái item:
  - hỗ trợ `isActive` để ẩn/khóa soft-delete.

## In-scope
- Danh sách item makeup có filter cơ bản (artist/package/status/search).
- CRUD item makeup (tạo/sửa/khóa active).
- Lưu và hiển thị Shopee URL.
- Mapping bắt buộc item -> package -> artist.

## Out-of-scope
- Đồng bộ tự động giá/tồn kho từ Shopee API.
- OCR ảnh sản phẩm hoặc AI tagging.
- Quản lý kho vật lý chi tiết (batch/lot/expiry) nâng cao.

## Prompt gợi ý cho Codex
```text
Mục tiêu: xây tab Inventory cho admin makeup với item có link Shopee và mapping package/artist.

Yêu cầu:
1) Thêm schema + API + UI cho makeup inventory items.
2) Mỗi item bắt buộc packageId và artistProfileId.
3) Field shopeeUrl hợp lệ theo policy domain.
4) Có list + filter + create/update + soft-disable.
5) Đảm bảo branch isolation và không ảnh hưởng module thuê đồ.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Có tab inventory makeup hiển thị danh sách item.
- Create/update item bắt buộc package + artist.
- Shopee URL lưu/hiển thị đúng và validate đúng.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Tạo item mới với package + artist hợp lệ.
- Nhập Shopee URL sai domain -> bị chặn.
- Filter theo package/artist trả đúng dữ liệu.
- Verify item makeup không xuất hiện trong inventory thuê đồ.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist module chưa có dòng `Modules/Makeup/010` thì thêm vào:
  - `progress/modules/makeup/tasks.md`
- Đánh dấu checklist khi done:
  ~~~bash
  sed -i "s|^- \[ \] Modules/Makeup/010 |- [x] Modules/Makeup/010 |" progress/modules/makeup/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/modules/makeup/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Modules/Makeup/010
  - Task file: docs/tasks/modules/makeup/010_makeup_admin_inventory_catalog_with_shopee_links_package_artist.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
