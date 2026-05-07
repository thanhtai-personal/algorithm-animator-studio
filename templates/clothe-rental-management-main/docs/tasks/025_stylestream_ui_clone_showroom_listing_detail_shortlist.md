# Task 025 - Stylestream UI Clone: Showroom Listing + Detail + Shortlist

## Mục tiêu
- Clone UI customer showroom từ template Stylestream vào các route showroom hiện có.
- Bổ sung shortlist page theo visual template và giữ anonymous-friendly behavior.

## Phụ thuộc
- `docs/tasks/018_customer_showroom_preselection_page.md`
- `docs/tasks/020_stylestream_ui_clone_foundation_and_shell.md`
- `docs/tasks/024_stylestream_ui_clone_settings_module.md` (nếu cần verify publish config visual)

## Nguồn clone template
- `templates/stylestream-showcase-main/src/pages/showroom/Listing.tsx`
- `templates/stylestream-showcase-main/src/pages/showroom/Detail.tsx`
- `templates/stylestream-showcase-main/src/pages/showroom/ShortlistPage.tsx`
- `templates/stylestream-showcase-main/src/components/ProductCard.tsx`
- `templates/stylestream-showcase-main/src/components/FilterSidebar.tsx`

## Mapping màn hình/source
- Showroom list:
  - route: `apps/web/src/app/[locale]/showroom/page.tsx`
  - component: `apps/web/src/features/showroom/components/ShowroomListPage.tsx`
- Showroom detail:
  - route: `apps/web/src/app/[locale]/showroom/[productId]/page.tsx`
  - component: `apps/web/src/features/showroom/components/ShowroomProductDetailPage.tsx`
- Shortlist page (thêm mới nếu chưa có):
  - route: `apps/web/src/app/[locale]/showroom/shortlist/page.tsx`
  - component: `apps/web/src/features/showroom/components/ShowroomShortlistPage.tsx`

## Prompt gợi ý cho Codex
```text
Mục tiêu: clone UI showroom (listing/detail/shortlist) từ Stylestream vào source hiện tại.

Yêu cầu:
1) Listing page:
   - clone hero, filter sidebar/sheet mobile, product card grid, empty state
2) Detail page:
   - clone gallery + info block + size/color/tag presentation + shortlist CTA
3) Shortlist page:
   - thêm route `/[locale]/showroom/shortlist`
   - clone list card layout, note textarea, share CTA style
4) Data/logic constraints:
   - giữ public read-only products flow
   - shortlist local/session storage vẫn anonymous-friendly
   - không thêm order/payment/lock logic
5) Tương thích settings showroom config/template publish hiện có.
6) Responsive first:
   - mobile filter drawer và sticky header behavior rõ ràng

Không thay business scope showroom MVP (không checkout online).
```

## Config cần chuẩn bị trước khi chạy task
- Chốt shortlist persistence:
  - localStorage (khuyến nghị)
  - hoặc store + persisted adapter hiện có.
- Chốt sharing behavior cho shortlist:
  - mock copy link
  - hay chỉ giữ UI placeholder.

## In-scope
- Clone UI showroom list/detail.
- Bổ sung và clone UI shortlist page.
- Đồng bộ showroom primitives (card/filter/chips/buttons).

## Out-of-scope
- Checkout/payment online.
- Inventory lock hoặc reservation từ page khách.
- CRM automation từ shortlist.

## Deliverables mong muốn
- Showroom customer-facing mang visual Stylestream rõ rệt.
- Shortlist route usable cho guest/anon.

## Done criteria (coding)
- `/[locale]/showroom` clone hero/filter/grid thành công.
- `/[locale]/showroom/[productId]` clone detail layout thành công.
- `/[locale]/showroom/shortlist` hoạt động với add/remove/note.
- Không lộ field nội bộ hoặc thêm flow ngoài scope.

## Nhắc test nhanh
- Manual: showroom list/detail/shortlist trên mobile + desktop.
- Manual: add/remove shortlist + reload persistence.
- Manual: locale switch `vi/en`.
- `cd apps/web && npm run lint:mvp`
- `cd apps/web && npm run typecheck:mvp`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \\[ \\] 025 |- [x] 025 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 025
  - Task file: docs/tasks/025_stylestream_ui_clone_showroom_listing_detail_shortlist.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
