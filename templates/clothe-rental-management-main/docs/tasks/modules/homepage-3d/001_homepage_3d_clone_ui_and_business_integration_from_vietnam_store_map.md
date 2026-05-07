# Task 001 - Homepage 3D: clone UI homepage từ template `vietnam-store-map-main`

## Mục tiêu
- Thực hiện bước 1 của module: clone UI homepage theo template `templates/vietnam-store-map-main`.
- Kết quả của bước này chỉ tập trung vào UI/presentation cho route home chung `/{language}/product`.
- Không xử lý logic auth redirect hoặc binding dữ liệu map branch trong task này.

## Phụ thuộc
- Không có.

## Tài liệu tham chiếu kiến trúc
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`

## Token Context Guard (bắt buộc)
- Mỗi lượt implement chỉ nạp: task `001` + file code UI đang sửa.
- Không nạp task `002-005` trong cùng lượt clone UI.
- Không copy/paste toàn bộ template HTML/CSS dài vào prompt.

## Architecture Impact
- Layers affected: `apps/web` component/template/styles cho `product-landing`.
- Domain affected: public homepage presentation.

## Current State vs Target State
- Current: homepage chưa clone đúng visual template bản đồ Việt Nam.
- Target (Architecture V2): route `/{language}/product` render được UI clone theo template, style scope cục bộ.

## Boundary Rules
- Must keep: `Component -> Hook -> Query -> Service -> API`.
- Must keep: chỉ dùng CSS local scope trong feature.
- Forbidden: chỉnh `apps/web/src/app/globals.css`.
- Forbidden: nhét business logic vào component trình bày.

## Compatibility & Migration Strategy
- Compatibility window: giữ renderer cũ trong giai đoạn UAT để so sánh.
- Rollback condition: rollback nếu UI clone gây vỡ layout/perf đáng kể.

## In-scope
- Clone layout/section/typography/spacing từ template vào homepage hiện tại.
- Chuẩn hóa asset path và responsive cơ bản để không vỡ desktop/mobile.

## Out-of-scope
- Route entry `/` và login button flow.
- Post-login redirect theo role/branch.
- Data contract branch map.

## Done Criteria (Architecture)
- [ ] Không vi phạm layering frontend.
- [ ] Không thay đổi `apps/web/src/app/globals.css`.
- [ ] Không thêm business endpoint mới trong `apps/web/src/app/api/**`.
- [ ] `cd apps/web && npm run lint` pass.
- [ ] `cd apps/web && npm run typecheck` pass.

## Regression Scope
- [ ] Không có horizontal overflow desktop/mobile.
- [ ] Không ảnh hưởng style dashboard/auth/branch pages.
- [ ] Không làm vỡ theme homepage khác.

## Cập nhật tiến độ (sau khi hoàn thành)
- Cập nhật checklist + completion log tại:
  - `progress/modules/homepage-3d/tasks.md`
