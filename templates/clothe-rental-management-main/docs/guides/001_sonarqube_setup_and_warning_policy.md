# SonarQube Setup Và Policy Cảnh Báo Complexity 15

## Mục tiêu
- Bật SonarQube scan cho monorepo.
- Giới hạn Cognitive Complexity là `15`.
- Chỉ cảnh báo (warning), không chặn merge/deploy.

## File cấu hình trong repo
- `sonar-project.properties`
- `.github/workflows/sonar-analysis.yml`

## 1) Chuẩn bị SonarQube project
1. Tạo project mới trên SonarQube.
2. Tạo token scan (`SONAR_TOKEN`).
3. Lấy URL SonarQube server (`SONAR_HOST_URL`).
4. Thêm secrets vào GitHub repository:
   - `SONAR_TOKEN`
   - `SONAR_HOST_URL`

## 2) Cấu hình Quality Profile cho complexity 15 (warning-only)
1. Vào `Quality Profiles`.
2. Chọn profile cho JavaScript/TypeScript đang gán cho project.
3. Tìm rule `Cognitive Complexity of functions should not be too high`:
   - key thường dùng: `javascript:S3776`
   - một số bản Sonar có thể hiển thị `typescript:S3776`
4. Đặt tham số `threshold = 15`.
5. Đặt severity ở mức cảnh báo (khuyến nghị `Minor`).

## 3) Đảm bảo non-blocking trong CI
- Workflow `sonar-analysis.yml` đã để scan ở chế độ non-blocking:
  - step scan dùng `continue-on-error: true`
  - thiếu secret thì tự skip scan
- Không thêm quality gate blocking step trong workflow này.

## 4) Cách đọc cảnh báo
- Khi complexity > 15, Sonar hiển thị issue trong tab `Issues`.
- Đây là cảnh báo để refactor dần, không phải lỗi bắt buộc chặn release.

## 5) Verify nhanh
1. Tạo một function test complexity > 15 trong nhánh local.
2. Push nhánh và kiểm tra workflow `SonarQube Analysis (Non-Blocking)`.
3. Vào SonarQube:
   - thấy issue complexity xuất hiện.
   - pipeline vẫn không bị block chỉ vì warning này.
