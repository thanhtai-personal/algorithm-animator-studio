# Task 004 - Bản đồ Việt Nam với icon branch + điều hướng branch homepage

## Mục tiêu
- Trang home chung `/{language}/product` hiển thị bản đồ Việt Nam và danh sách icon store theo branch.
- Mỗi icon đại diện đúng 1 branch, click icon mở homepage branch `/{language}/{branch-domain}`.

## Token Context Guard
- Chỉ nạp: task `001`, task `004`, và file component/hook/query phục vụ map.
- Không nạp full auth flow trong lượt làm map UI.
- Chỉ trích DTO/route cần dùng, không dán danh sách branch lớn vào prompt.

## Architecture Impact
- Layers affected: `apps/web` map component + hook/query/service branch data.
- Có thể ảnh hưởng `apps/server` endpoint public branch list nếu thiếu contract.
- Domain affected: public branch discovery + branch-domain navigation.

## Current State vs Target State
- Current: homepage chưa có map icon branch end-to-end từ dữ liệu thật.
- Target (Architecture V2): map render dữ liệu thật, click icon đi đúng route branch.

## Boundary Rules
- Must keep: dữ liệu branch lấy qua service/query.
- Must keep: route chuẩn `/{language}/{branch-domain}`.
- Forbidden: query DB trực tiếp từ web runtime.
- Forbidden: nhúng business filter vào component map.

## Compatibility & Migration Strategy
- Compatibility window: fallback sang branch list khi map data chưa đủ.
- Rollback condition: fallback list navigation nếu map render lỗi.

## Done Criteria (Architecture)
- [ ] Home chung render map + icon branch từ dữ liệu thật.
- [ ] Click icon luôn mở `/{language}/{branch-domain}` đúng branch.
- [ ] Có fallback khi branch thiếu tọa độ/map metadata.
- [ ] Không thêm endpoint business mới trong `apps/web/src/app/api/**`.
- [ ] Không truy cập Supabase trực tiếp từ web.
- [ ] `cd apps/web && npm run lint` pass.
- [ ] `cd apps/web && npm run typecheck` pass.

## Regression Scope
- [ ] Không có icon trùng branch hoặc trỏ sai domain.
- [ ] Không vỡ layout map ở desktop/mobile.
- [ ] Route branch homepage hiện có vẫn hoạt động với link trực tiếp.
