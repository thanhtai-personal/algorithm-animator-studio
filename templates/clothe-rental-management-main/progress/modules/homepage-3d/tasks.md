# Tiến Độ Module: Homepage 3D

## Cách dùng
- Sau khi hoàn thành coding task trong `docs/tasks/modules/homepage-3d`, cập nhật checklist và append 1 log entry vào file này.
- Không theo dõi theo kiểu "master task"; mỗi task con có trạng thái riêng.
- Giữ format log đồng nhất với `progress/tasks.md`.

## Checklist
- [x] Modules/Homepage-3D/001 | Clone UI homepage từ template vietnam-store-map-main | status=done | owner=codex | started=2026-04-19 | done=2026-04-19
- [x] Modules/Homepage-3D/002 | Chuẩn hóa route entry `/` + login button | status=done | owner=codex | started=2026-04-19 | done=2026-04-19
- [x] Modules/Homepage-3D/003 | Post-login redirect theo role/branch | status=done | owner=codex | started=2026-04-19 | done=2026-04-19
- [x] Modules/Homepage-3D/004 | Bản đồ Việt Nam + icon branch + navigation | status=done | owner=codex | started=2026-04-19 | done=2026-04-19
- [x] Modules/Homepage-3D/005 | Contract dữ liệu branch map (server + consumers) | status=done | owner=codex | started=2026-04-19 | done=2026-04-19
- [x] Modules/Homepage-3D/006 | Super admin chỉnh sửa homepage chung (global scope) | status=done | owner=codex | started=2026-04-19 | done=2026-04-19
- [x] Modules/Homepage-3D/007 | Visual edit mode kéo thả icon store trên map global | status=done | owner=codex | started=2026-04-19 | done=2026-04-19
- [x] Modules/Homepage-3D/008 | Hỗ trợ nhiều icon store cho một branch trên map global | status=done | owner=codex | started=2026-04-19 | done=2026-04-19
- [x] Modules/Homepage-3D/009 | Refactor global visual editor: đưa map + field edit vào right drawer, thêm icon bút chì trên preview, và fix apply marker config giữa preview/homepage | status=done | owner=codex | started=2026-04-22 | done=2026-04-22

## Completion Log
<!-- Append logs below this line. -->
- 2026-04-19 | Modules/Homepage-3D/001 | Hoàn thành clone UI homepage map từ template vào `/{locale}/product` bằng component + CSS module scope cục bộ, không chỉnh global CSS.
- 2026-04-19 | Modules/Homepage-3D/002 | Chuẩn hóa route entry `/` và `/{locale}` về `/{locale}/product`; homepage map có login action về `/{locale}/auth`.
- 2026-04-19 | Modules/Homepage-3D/003 | Cập nhật post-login redirect: customer có branch-domain vào `/{locale}/{branch-domain}`, không có branch về `/{locale}/product`; các role còn lại giữ admin shell hiện hành.
- 2026-04-19 | Modules/Homepage-3D/004 | Home chung hiển thị map với icon branch từ dữ liệu thật, click icon điều hướng về homepage branch tương ứng.
- 2026-04-19 | Modules/Homepage-3D/005 | Bổ sung contract/API `GET /api/v1/settings/public/branch-map` và đồng bộ consumer web để đọc đủ field branch map.
- 2026-04-19 | Modules/Homepage-3D/006 | Thêm scope `global|branch` cho showroom pages (server + web), khóa quyền write global chỉ `owner_admin`, và `/product` đọc config global đã publish qua `scope=global`.
- 2026-04-19 | Modules/Homepage-3D/007 | Thêm visual editor kéo thả marker store cho homepage chung trong settings, lưu `globalHomepage.markerPositionsByBranchId` vào `themeConfigJson`, và render `/product` theo tọa độ đã publish.
- 2026-04-19 | Modules/Homepage-3D/008 | Mở rộng contract marker sang `globalHomepage.markers[]` (multi-icon/branch) có tương thích ngược map cũ, cập nhật editor global để CRUD/reorder nhiều marker mỗi branch, và render `/product` theo marker collection mới.
- 2026-04-22 | Modules/Homepage-3D/009 | Đưa global homepage editor sang right drawer với pencil in-place trên preview, tích hợp map marker editor vào drawer, đồng bộ preview/homepage map renderer qua `VietnamStoreMapHomepage` có slot anchors và selected marker highlight.
