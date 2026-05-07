# Tiến Độ Module: Setup Source

## Cách dùng
- Sau khi hoàn thành coding task trong `docs/tasks/modules/setup-source`, cập nhật checklist và append 1 log entry vào file này.
- Giữ format log đồng nhất với `progress/tasks.md`.
- Không xóa log cũ; chỉ append để giữ lịch sử.

## Checklist
- [x] Modules/Setup-Source/001 | Setup source: SonarQube (sonar queue) + giới hạn complexity 15 (warning-only) | status=done | owner=[codex] | started=[2026-03-11] | done=[2026-03-11]
- [x] Modules/Setup-Source/002 | Setup source: cấu hình Sentry app (error monitoring + release health) | status=done | owner=[codex] | started=[2026-03-11] | done=[2026-03-11]

## Completion Log
<!-- Append logs below this line. -->

### 2026-03-11 - Modules/Setup-Source/001
- Task file: docs/tasks/modules/setup-source/001_setup_source_sonar_queue_warning_complexity_15.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [`cd apps/web && npm run lint` fails on pre-existing legacy issues ngoài phạm vi task ở `src/lib/storageAdapter.ts`, `src/lib/voice/useVoiceDictation.ts`, `tailwind.config.ts`; `cd apps/mobile && EXPO_NO_TELEMETRY=1 EXPO_HOME=\"$PWD/.expo-home\" npm run lint` fails because local environment cannot resolve/install mobile lint deps (`Cannot find module 'eslint'`; retry install hit `EAI_AGAIN` network resolution)]
- Main files changed: [sonar-project.properties], [.github/workflows/sonar-analysis.yml], [docs/guides/sonarqube_setup_and_warning_policy.md], [.gitignore], [progress/tasks.md]
- Known gaps: [Cognitive Complexity threshold=15 with warning severity is configured at SonarQube Quality Profile level (UI/runbook), not hard-enforced by local scanner file alone]

### 2026-03-11 - Modules/Setup-Source/002
- Task file: docs/tasks/modules/setup-source/002_setup_source_sentry_app_error_monitoring_release_health.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [`cd apps/web && npm run lint` fails on pre-existing legacy issues ngoài phạm vi task ở `src/lib/storageAdapter.ts`, `src/lib/voice/useVoiceDictation.ts`, `tailwind.config.ts`; `cd apps/mobile && EXPO_NO_TELEMETRY=1 EXPO_HOME=\"$PWD/.expo-home\" npm run lint` fails on pre-existing unresolved-import issues ngoài phạm vi task ở nhiều file cũ như `src/lib/i18n.tsx`, `src/lib/themeProvider.tsx`, `src/lib/themeVariants.ts`, `src/lib/voice/*`.]
- Main files changed: [apps/web/next.config.ts], [apps/web/sentry.client.config.ts], [apps/web/sentry.server.config.ts], [apps/web/sentry.edge.config.ts], [apps/web/src/app/global-error.tsx], [apps/web/src/lib/sentry/sanitizeEvent.ts], [apps/mobile/app/_layout.tsx], [apps/mobile/metro.config.js], [apps/mobile/app.json], [apps/mobile/eas.json], [apps/mobile/src/lib/sentry/config.ts], [apps/mobile/src/lib/sentry/sanitizeEvent.ts], [apps/mobile/src/lib/sentry/index.ts], [apps/mobile/.github/workflows/eas-build.yml], [docs/guides/sentry_setup_and_release_policy.md], [progress/tasks.md]
- Known gaps: [Web source map upload vẫn phụ thuộc biến môi trường CI (`SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`); nếu thiếu thì SDK vẫn chạy nhưng không upload source maps.]
