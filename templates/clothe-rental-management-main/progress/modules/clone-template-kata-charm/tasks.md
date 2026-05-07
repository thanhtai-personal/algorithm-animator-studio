# Tiến Độ Module: Clone UI Templates - KATA Charm

## Cách dùng
- Sau khi hoàn thành coding task trong `docs/tasks/modules/clone-UI-templates/kata-charm`, cập nhật checklist và append 1 log entry vào file này.
- Giữ format log đồng nhất với `progress/tasks.md`.
- Không xóa log cũ; chỉ append để giữ lịch sử.

## Checklist
- [x] Modules/Clone-Template-KATA-Charm/001 | Step 1: Clone UI parity tuyệt đối + CSS isolation giữa các theme (mock data) | status=done | owner=[codex] | started=[2026-04-09] | done=[2026-04-09]
- [x] Modules/Clone-Template-KATA-Charm/002 | Step 2: Refactor + parity chức năng với default theme (loại dư, bổ thiếu) | status=done | owner=[codex] | started=[2026-04-11] | done=[2026-04-11]
- [x] Modules/Clone-Template-KATA-Charm/003 | Step 3: Theme render dùng config từ Step 4 (backend data thật) | status=done | owner=[codex] | started=[2026-04-11] | done=[2026-04-11]
- [x] Modules/Clone-Template-KATA-Charm/004 | Step 4: Theme config schema riêng + admin fields động | status=done | owner=[codex] | started=[2026-04-11] | done=[2026-04-11]

## Completion Log
<!-- Append logs below this line. -->

### 2026-04-09 - Modules/Clone-Template-KATA-Charm/001
- Task file: docs/tasks/modules/clone-UI-templates/kata-charm/001_clone_parity_mock.md
- Status: done
- Commit: [89be5df]
- Notes: Clone parity mock cho template Charm đã được đánh dấu hoàn thành trong task doc.

### 2026-04-11 - Modules/Clone-Template-KATA-Charm/002
- Task file: docs/tasks/modules/clone-UI-templates/kata-charm/002_refactor_mock.md
- Status: done
- Commit: [pending-local]
- Notes: Refactor template Charm thành config/header/sections để dễ maintain, giữ nguyên visual parity và action routing sang showroom/booking.

### 2026-04-11 - Modules/Clone-Template-KATA-Charm/003
- Task file: docs/tasks/modules/clone-UI-templates/kata-charm/003_backend_binding.md
- Status: done
- Commit: [pending-local]
- Notes: Bổ sung read-path themeConfigJson cho Charm (ưu tiên backend, fallback legacy), map dữ liệu branch/locale vào renderer product landing + showroom viewConfig để đồng bộ route matrix công khai.

### 2026-04-11 - Modules/Clone-Template-KATA-Charm/004
- Task file: docs/tasks/modules/clone-UI-templates/kata-charm/004_theme_config_schema.md
- Status: done
- Commit: [pending-local]
- Notes: Thêm schema riêng `editor=theme-charm`, dynamic admin fields cho Charm, server-side migrate+validate+normalize trước khi lưu `themeConfigJson`, đồng thời project về legacy fields để giữ tương thích read-path/public routes.
