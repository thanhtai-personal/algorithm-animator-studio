# 012 - Cấu Trúc Source `apps/server` Cho CMS Admin (NestJS)

## 1) Mục tiêu
- Chuẩn hóa cấu trúc code backend cho `apps/server` theo hướng mở rộng dài hạn.
- Giữ đúng constitution hiện tại: chỉ `apps/server` được truy cập Supabase DB.
- Tăng khả năng mở rộng domain, RBAC, audit, queue/scheduler mà không tạo coupling chéo.

## 2) Kiến trúc chọn
- Chọn mô hình: **modular monolith theo domain**.
- Không khởi đầu bằng microservices.
- Không chia source toàn cục theo kiểu `controllers/`, `services/`, `repositories/` cho cả project.
- Mỗi domain module là một "vertical slice", bên trong module mới tách lớp.

## 3) Layer contract trong `apps/server`
Theo chuẩn kiến trúc V2 và `.mcp.full.md`, backend flow chuẩn:

```text
Controller -> Application Service -> Repository/Data-access -> Supabase
```

Để scale tốt cho CMS admin, mỗi module tổ chức theo 4 phần:
- `presentation`: controller, dto, presenters/serializers.
- `application`: use-cases, orchestration services.
- `domain`: entities, repository interfaces, domain policies/rules.
- `infrastructure`: repository implementation, mapper, adapter tích hợp ngoài.

Mapping với constitution:
- `presentation` = Controller boundary.
- `application` = business orchestration service.
- `domain` = business rules/abstractions.
- `infrastructure` = data-access layer duy nhất chạm Supabase.

## 4) Cấu trúc thư mục khuyến nghị
```text
apps/server/src/
  main.ts
  app.module.ts

  core/
    config/
    security/
    common/
      filters/
      interceptors/
      pipes/
      decorators/
      response/
      exceptions/
      pagination/
      utils/

  shared/
    storage/
    mail/
    queue/
    cache/
    audit/
    upload/

  modules/
    auth/
      presentation/
      application/
      domain/
      infrastructure/
      auth.module.ts
    users/
    roles/
    permissions/
    media/
    products/
    categories/
    orders/
    returns/
    payments/
    settings/
    dashboard/
    notifications/
    audit-logs/
    imports/
    exports/

  jobs/
    processors/
    schedulers/
```

## 5) Mẫu module chuẩn
Ví dụ module `products`:

```text
modules/products/
  presentation/
    products.controller.ts
    dto/
      create-product.dto.ts
      update-product.dto.ts
      query-product.dto.ts
    presenters/
      product.presenter.ts
  application/
    use-cases/
      create-product.use-case.ts
      update-product.use-case.ts
      list-products.use-case.ts
    services/
      product-code.service.ts
  domain/
    entities/
      product.entity.ts
    repositories/
      product.repository.ts
    policies/
      product-policy.ts
  infrastructure/
    repositories/
      supabase-product.repository.ts
    mappers/
      product.mapper.ts
  products.module.ts
```

## 6) Request lifecycle chuẩn cho CMS admin
```text
Middleware -> Guard -> Interceptor -> Pipe(Validation/Transform)
-> Controller -> Use case -> Repository -> Response Interceptor
```

Quy tắc:
- Guard chịu trách nhiệm auth + RBAC.
- Pipe chịu trách nhiệm validation/transform input.
- Controller không chứa business logic.
- ExceptionFilter chuẩn hóa error contract.

## 7) Cross-cutting bắt buộc đặt ở `core` hoặc `shared`
- ConfigModule + env typing/validation.
- Global ValidationPipe.
- Global ExceptionFilter.
- Request logging interceptor + request id.
- Response envelope contract.
- Pagination contract.
- Current-user decorator.
- Swagger/OpenAPI contract.

## 8) RBAC chuẩn cho admin backend
- Không hard-code vai trò khắp nơi.
- Tách rõ `roles`, `permissions`, `role_permissions`.
- Permission naming theo resource-action:
  - `products.read`
  - `products.create`
  - `products.update`
  - `orders.manage`
  - `settings.manage`
- Route policy dùng decorator + guard:
  - `@Permissions('products.update')`
  - `@UseGuards(JwtAuthGuard, PermissionsGuard)`

## 9) DTO và validation policy
- DTO tách riêng cho:
  - create
  - update
  - query/filter
- Bật `ValidationPipe` global.
- Không validate thủ công trong service trừ trường hợp domain rule đặc thù.

## 10) Database/repository policy
- Domain layer chỉ biết repository interface.
- Infrastructure layer implement repository bằng Supabase query.
- Controller/Application không gọi trực tiếp query client.
- `apps/server` là runtime duy nhất truy cập DB.

## 11) Queue, cache, scheduler policy
- Queue cho công việc nặng:
  - import/export
  - xử lý media
  - gửi notification
  - generate report
- Cache cho dữ liệu đọc nhiều, đổi ít:
  - settings
  - permission matrix
  - dashboard aggregate
- Scheduler cho tác vụ định kỳ:
  - cleanup
  - sync
  - publish/unpublish theo lịch

## 12) Anti-pattern cấm
- Chia source toàn cục theo technical layer (`controllers/`, `services/` chung toàn app).
- Controller gọi trực tiếp Supabase query.
- Service domain phình quá lớn, ôm nhiều use-case không liên quan.
- Duplicate business logic giữa `apps/web` legacy API và `apps/server`.
- Hard-code role checks rải rác không qua permissions guard/policy.

## 13) Quy tắc áp dụng cho task mới
- Task nào thêm/sửa module trong `apps/server` phải mô tả rõ:
  - domain module bị ảnh hưởng
  - lớp bị thay đổi (`presentation/application/domain/infrastructure`)
  - lý do nếu chưa tách đủ 4 lớp (phase migration)
- Mọi endpoint mới bắt buộc tạo tại `apps/server`, không tạo mới ở web compatibility routes.

## 14) Quy tắc tách file backend (bắt buộc)
- Giới hạn kích thước file: tối đa `400` dòng/file.
  - Các file legacy đang vượt ngưỡng phải được giảm dần theo từng task.
  - Gate tự động: `apps/server/scripts/architecture/enforce-server-source-rules.mjs`.
- Type definitions:
  - đặt trong thư mục `types/`.
  - tên file theo chuẩn:
    - `<TypeAliasName>.type.ts` cho `type`.
    - `<InterfaceName>.interface.ts` cho `interface`.
  - mỗi file chỉ được khai báo `1` export `type/interface` (legacy file có thể tạm waiver, nhưng file mới bắt buộc tuân thủ).
- Constants và utilities:
  - tách sang file riêng (`*.constants.ts`, `*.utils.ts`) thay vì để trong file service/data-access lớn.
- Data-access tổ chức theo entrypoint + implementation:
  - `infrastructure/*.data-access.ts` là file entrypoint mỏng (chỉ expose contract/điều phối).
  - logic query/aggregation chi tiết tách xuống `infrastructure/data-access/*.data-access.ts`.
  - không thêm logic data-access lớn trực tiếp vào file entrypoint trong `infrastructure/`.
- Mapping chuyển đổi data type:
  - khi chuyển đổi giữa các type tương tự (ví dụ request -> payload/entity, row -> response), bắt buộc dùng mapper class.
  - đặt mapper trong thư mục `mappers/`.
  - tên file theo chuẩn `<SourceType>To<TargetType>.mapper.ts`.
  - mapper class bắt buộc có 2 hàm:
    - `map` cho 1 đối tượng.
    - `maps` cho danh sách đối tượng.
- Quy tắc class export:
  - mỗi file chỉ export tối đa 1 class.
  - ngoại lệ duy nhất: file `*.constants.ts` và `*.utils.ts` (được phép nhiều export non-class).
- Quy tắc tên file khớp export chính:
  - với file class theo suffix chuẩn (`*.service.ts`, `*.controller.ts`, `*.module.ts`, `*.dto.ts`, `*.interceptor.ts`, `*.filter.ts`, `*.guard.ts`, `*.pipe.ts`):
    - tên file phải map theo class export chính dạng kebab-case + suffix tương ứng.
    - ví dụ: `AuthService` -> `auth.service.ts`, `CreateMiniAppSessionDto` -> `create-mini-app-session.dto.ts`.
  - với `*.mapper.ts`:
    - tên file dùng tên class mapper sau khi bỏ hậu tố `Mapper`, rồi thêm `.mapper.ts`.
- Quy tắc tận dụng decorator (NestJS):
  - module controller bắt buộc dùng `@V1Controller('<path>')`, không dùng trực tiếp `@Controller({ path, version: '1' })`.
  - ưu tiên dùng decorator param chuẩn hoá truy xuất request/query/body:
    - `@ApiRequest()` thay cho `@Req()`.
    - `@NullableQuery('<key>')`, `@NullableBodyField('<key>')` cho input optional cần normalize.
  - file decorator đặt trong `decorators/` và dùng suffix `.decorator.ts`.
