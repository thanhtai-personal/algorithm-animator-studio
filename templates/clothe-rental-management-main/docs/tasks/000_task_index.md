# Bộ Task Triển Khai Dự Án Thuê Đồ + Trang Showroom (Roadmap Thực Thi)

## Token Context Guard (bắt buộc)
- File này chỉ để tra cứu roadmap, không đưa toàn bộ file vào context khi implement task cụ thể.
- Khi làm việc: chỉ nạp file task đang thực thi + tài liệu bắt buộc trực tiếp.
- Chuẩn áp dụng: `docs/tasks/000_task_token_efficiency_standard.md`

## Mục tiêu file này
- Chia toàn bộ PRD + wireframe thành các bước thực thi tuần tự trong `apps/web`.
- Mỗi bước có file task riêng để dùng trực tiếp với Codex/agent.
- Bám source base hiện tại: `apps/web` mới có auth + session panel, chưa có các module admin và chưa có trang showroom cho khách.

## Ghi chú thuật ngữ (tránh hiểu sai)
- `trang showroom` = trang khách xem/chọn sản phẩm trước khi tới shop thử đồ.
- `shop/branch/chi nhánh` = cửa hàng/showroom vật lý dùng để vận hành và áp dụng RLS data isolation.
- Các task `schema/RLS/branches` vẫn giữ tên `showroom core` theo lịch sử đặt tên, nhưng mục tiêu là backend cho toàn hệ thống (admin + showroom page khách).

## Tài liệu nguồn đã đối chiếu
- `docs/000_Business_requests.md`
- `docs/001_wireframe.md`
- `AGENTS.md`
- `.mcp.full.md`
- `docs/architecture/000_architecture_index.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `templates/my-money-cloud-main/docs/000_authen-and-data-flow.md`
- `templates/my-money-cloud-main/docs/test-case/auth-cases.md`
- `templates/stylestream-showcase-main/src/pages/**`
- `templates/stylestream-showcase-main/src/components/layouts/**`

## Ràng buộc kiến trúc bắt buộc (áp dụng cho mọi task)
- Flow: `Component -> Hook -> Query -> Service -> API (apps/server)`
- Không gọi service trực tiếp trong component/hook nếu đã có query layer.
- React Query quản request lifecycle; MobX store giữ UI-visible state.
- Store-first hydration: fetch -> merge store -> UI đọc từ store.
- Giữ invariants auth/anon/offline:
  - anonymous mode hợp lệ
  - tránh silent data loss khi anon -> account đã có dữ liệu
  - cảnh báo logout khi còn pending sync
- Theo kiến trúc mới (V2): endpoint business mới phải ưu tiên ở `apps/server`; không mở rộng thêm business API mới trong `apps/web/app/api` nếu domain đó đã migrate.
- Chỉ `apps/server` được phép truy cập Supabase DB; runtime khác phải qua API server.

## Chuẩn task mới bắt buộc (Architecture Compliance V2)
- Cấu trúc task bắt buộc theo chuẩn Task 003:
  - `docs/tasks/000_task_structure_standard.md`
- Mọi task mới phải có các section:
  1) `Architecture Impact`
  2) `Current State vs Target State`
  3) `Boundary Rules`
  4) `Compatibility & Migration Strategy` (nếu có cutover)
  5) `Done Criteria (Architecture)`
  6) `Regression Scope`
- Checklist compliance bắt buộc trong task:
  - [ ] Không phá layering/import boundary.
  - [ ] Không tạo duplicate business logic ở runtime cũ và mới.
  - [ ] Có caller cutover list nếu task đụng API contract.
  - [ ] Có rollback condition rõ ràng với task migration.
- Rule theo dõi tiến độ:
  - Không tạo `master task` để gom triển khai.
  - Với module tasks, bắt buộc theo dõi qua `progress/modules/<module>/tasks.md`.
- Chi tiết chuẩn: `docs/architecture/011_task_architecture_compliance_standard.md`.

## Lưu ý quan trọng về source base hiện tại (apps/web)
- Route hiện có: `/`, `/auth`, `/auth/callback`, `/api/auth/*`
- Chưa có route `/{locale}/dashboard`, `/{locale}/showroom` và các module admin/showroom
- `I18nProvider` hiện là client-side, chưa dùng locale routing `/[locale]`
- SQL hiện tại (`apps/web/sql/000_create_relations.sql`) vẫn là schema gốc finance app (categories/transactions/user_settings), chưa phải showroom schema theo PRD

## Thứ tự thực hiện khuyến nghị
1. `001_foundation_source_base_alignment.md`
2. `002_supabase_schema_showroom_core.md`
3. `003_auth_profiles_rbac_branching.md`
4. `004_locale_routing_app_shell.md`
5. `005_shared_ui_and_domain_primitives.md`
6. `006_products_catalog_module.md`
7. `018_customer_showroom_preselection_page.md` (public/customer-facing showroom page)
8. `007_inventory_items_module.md`
9. `008_customers_crm_module.md`
10. `009_orders_domain_and_availability_core.md`
11. `010_orders_list_and_create_flow.md`
12. `011_order_detail_pickup_return_flow.md`
13. `012_payments_module_reconciliation.md`
14. `013_dashboard_overview_module.md`
15. `014_calendar_module_reminders.md`
16. `015_reports_module.md`
17. `016_settings_users_roles_general.md`
18. `017_i18n_completion_and_release_hardening.md`
19. `019_auth_role_based_redirect_and_flow_completion.md`
20. `020_stylestream_ui_clone_foundation_and_shell.md`
21. `021_stylestream_ui_clone_dashboard_kpi_module.md`
22. `022_stylestream_ui_clone_products_inventory_customers.md`
23. `023_stylestream_ui_clone_orders_payments_reports.md`
24. `024_stylestream_ui_clone_settings_module.md`
25. `025_stylestream_ui_clone_showroom_listing_detail_shortlist.md`
26. `026_stylestream_ui_clone_visual_hardening_and_qa.md`
27. `027_stylestream_ui_clone_calendar_auth_and_remaining_screens.md`
28. `028_stylestream_ui_clone_header_footer_navigation_parity.md`
29. `029_stylestream_ui_clone_multitheme_dark_light_palette.md`
30. `030_stylestream_ui_clone_motion_charts_and_component_parity.md`
31. `031_stylestream_ui_clone_full_parity_closure.md`
32. `032_notifications_module_supabase_realtime.md`
33. `033_pwa_web_enablement.md`
34. `034_staff_sales_pos_unified_module.md`
35. `035_staff_product_entry_pos_style_rbac.md`
36. `036_bugs_admin_products_page.md`
37. `037_add_role_customer.md`
38. `038_showroom_management_slug_default_routing.md`
39. `039_product_pricing_cost_stock_rent_count_showroom_display.md`
40. `040_category_management_settings_rbac_products_sync.md`
41. `041_product_landing_home_clone_admin_config_logo_featured.md`
42. `042_remove_product_variant_creation_simplification.md`
43. `043_media_management_dashboard_and_product_picker.md`
44. `044_add_sold_status_for_items.md`
45. `045_quantity_based_stock_without_items.md`
46. `046_inventory_add_item_form_completion.md`
47. `047_owner_admin_role_protection_seed_only.md`
48. `048_orders_domain_order_type_and_debt_status.md`
49. `049_orders_create_modal_rental_sale_compact_defaults.md`
50. `050_return_order_modal_source_filter_and_sync.md`
51. `051_settlement_no_partial_and_debt_lifecycle.md`
52. `052_revenue_debt_unified_calculation_dashboard_reports.md`
53. `053_dashboard_pos_order_creation_parity_inline_customer.md`
54. `054_financial_formulas_revenue_profit_standardization.md`
55. `055_revenue_profit_charts_day_month_year_dashboard_reports.md`
56. `056_fix_invalid_payment_on_rental_order_create.md`
57. `057_staff_customer_minimal_create_and_customer_phone_password_signin.md`
58. `058_pos_shift_open_close_completion.md`
59. `modules/shipping/001_shipping_module_toggle_and_rental_auto_pickup.md`
60. `modules/makeup/001_makeup_module_foundation_toggle_rbac_schema.md`
61. `modules/makeup/002_makeup_booking_conflict_warning_and_override.md`
62. `modules/makeup/003_makeup_expert_schedule_and_conflict_calendar_colors.md`
63. `modules/makeup/004_makeup_admin_artist_directory_and_schedule_visibility.md`
64. `modules/makeup/005_makeup_packages_setup_admin_and_artist.md`
65. `modules/makeup/006_makeup_revenue_profit_artist_stats_and_dashboard_module_split.md`
66. `065_procurement_intake_manual_excel_import_and_dual_profit_metrics.md`
67. `066_procurement_product_input_upsert_and_excel_native_import.md`
68. `067_rounding_rules_frontend_only_backend_precision.md`
69. `068_bulk_item_status_update_laundry_to_ready.md`
70. `069_procurement_payment_integrity_and_immutable_intake_lines.md`
71. `070_performance_backend_query_pushdown_and_server_pagination.md`
72. `071_frontend_performance_render_bundle_and_image_optimization.md`
73. `072_performance_observability_and_regression_budget.md`
74. `073_component_refactor_split_large_components_and_extract_utils_constants.md`
75. `074_system_wide_voice_input_ios_webkit_compatibility.md`
76. `modules/setup-source/001_setup_source_sonar_queue_warning_complexity_15.md`
77. `modules/setup-source/002_setup_source_sentry_app_error_monitoring_release_health.md`
78. `modules/clone-template-kata-3d/001_clone_parity_mock.md`
79. `modules/clone-template-kata-3d/002_refactor_mock.md`
80. `modules/clone-template-kata-3d/003_backend_binding.md`
81. `modules/clone-template-kata-charm/001_clone_parity_mock.md`
82. `modules/clone-template-kata-charm/002_refactor_mock.md`
83. `modules/clone-template-kata-charm/003_backend_binding.md`
84. `modules/clone-template-kata-modern/001_clone_parity_mock.md`
85. `modules/clone-template-kata-modern/002_refactor_mock.md`
86. `modules/clone-template-kata-modern/003_backend_binding.md`
87. `modules/pwa-custom/001_pwa_split_pos_admin_product_apps.md`
88. `079_performance_critical_web_pages_loading_latency_program.md`
89. `080_home_product_landing_performance_optimization.md`
90. `081_pos_page_performance_optimization.md`
91. `082_makeup_booking_form_loading_optimization.md`
92. `083_showroom_page_performance_optimization.md`
93. `084_cart_shortlist_loading_optimization.md`
94. `085_settings_showroom_pages_visual_editor_in_place_drawer.md`
95. `088_short_term_quick_rent_price_same_day_field.md`
96. `090_pos_surcharge_expense_and_admin_passkey_lock.md`
97. `091_procurement_import_order_decoupled_products_and_import_payment_flag.md`
98. `092_payment_initial_capital_flag_pos_toggle_and_dashboard_capital_procurement_stats.md`
99. `093_realtime_dashboard_web_zalo_payment_push_notifications.md`
100. `094_rental_reserved_pickup_and_deposit_payment_flow.md`
101. `095_bug_admin_products_list_mobile_responsive.md`
102. `096_bug_admin_product_create_drawer_mobile_responsive.md`
103. `097_bug_sales_product_entry_mobile_responsive.md`
104. `098_bug_admin_payments_mobile_responsive.md`
105. `099_pos_payment_receipt_image_upload.md`
106. `100_bug_settings_branches_domain_phone_currency_validation.md`

## Cách dùng mỗi task file
1. Đọc phần `Config cần chuẩn bị`.
2. Điền thông tin còn thiếu (env, policy, naming, branch seed...).
3. Nếu task có `Prompt gợi ý cho Codex` thì dùng bản ngắn; không tự thêm prompt dài.
4. Kiểm tra `Done criteria (coding)` + `Nhắc test nhanh`.
5. Chạy phần `Cập nhật tiến độ` trong task để cập nhật đúng file progress index:
  - `progress/tasks.md` (task root) hoặc
  - `progress/modules/<module>/tasks.md` (task module)
6. Chỉ sang task tiếp theo khi task trước pass.
7. Khi tạo task mới, bắt buộc khởi tạo từ `docs/tasks/000_task_template_architecture_v2.md` và tuân thủ `docs/tasks/000_task_structure_standard.md`.

## Quy ước prompt trong bộ task
- Prompt mặc định yêu cầu patch tối thiểu, không refactor lan rộng.
- Nếu task đụng auth/offline/anon: bắt buộc liệt kê regression checks trong summary.
- Nếu task đụng schema/RLS: phải có SQL migration idempotent hoặc migration strategy rõ ràng.
- Bộ task này ưu tiên `coding tasks`; QA/UAT không tách task riêng, chỉ xuất hiện dưới dạng `Nhắc test nhanh` ở cuối mỗi task.
- Voice input cho admin forms là yêu cầu cross-cutting:
  - UI primitive/hook chung nên đi từ `Task 005`
  - feature forms chỉ consume shared primitive, không gọi trực tiếp browser speech API trong component nếu có thể tránh
- `Task 018` bổ sung showroom page cho khách (pre-selection) nhưng không thay đổi nguyên tắc: checkout/payment online vẫn phase 2.
- Cấu hình nội dung hiển thị + chọn template cho showroom page khách thuộc `Task 016` (Settings), còn render/showroom UI khách thuộc `Task 018`.
- Nếu demo MVP cần admin đổi config/template và thấy hiệu lực ngay trên page khách, nên làm `Task 016` song song giai đoạn cuối `Task 018` hoặc kéo `Task 016` lên trước `Task 018`.
- Shipping module là bước chuẩn bị trước makeup:
  - thêm toggle vận chuyển (default off),
  - behavior cũ `shipping off => rental auto PICKED_UP` đã bị thay thế bởi Task `094`,
  - flow thuê mới: tạo đơn ở `RESERVED`/hẹn ngày thuê, POS pickup action mới chuyển `PICKED_UP`,
  - return source filter vẫn chỉ lấy đơn `PICKED_UP`.
- Module Makeup (module-local tasks `001-006`) là mở rộng sau bước shipping toggle:
  - `001`: foundation (toggle + RBAC + schema/API contracts),
  - `002`: booking + cảnh báo trùng lịch mềm + override lưu,
  - `003`: lịch chuyên gia + calendar màu cảnh báo ngày conflict,
  - `004`: admin artist directory + schedule visibility theo từng chuyên viên,
  - `005`: setup gói makeup cho admin + makeup_artist,
  - `006`: thống kê makeup cho chuyên viên + dashboard admin split theo module.
- Task `065` mở rộng root roadmap cho module nhập hàng:
  - nhập tay bằng form hoặc import Excel,
  - có export file mẫu Excel,
  - hỗ trợ payment chi (bao gồm trả cọc),
  - hiển thị song song lợi nhuận bán hàng và lợi nhuận thực tế (thu - chi).
- Task `066` là pha cải thiện procurement sau `065`:
  - nhận diện sản phẩm cũ/mới theo `product_code`,
  - cho phép upsert sản phẩm trong flow nhập hàng (update nếu cũ, tạo nếu mới),
  - chuyển import/export procurement sang Excel native hoàn toàn (không CSV contract).
- Task `091` cập nhật lại định hướng procurement theo nghiệp vụ mới:
  - import Excel chỉ tạo đơn nhập + payment chi `isImportOrder`,
  - sản phẩm chỉ được tạo khi user bấm "Tạo sản phẩm" trong chi tiết đơn nhập,
  - đơn nhập, payment và sản phẩm không còn bị ràng buộc vòng đời cứng với nhau.

## Nhắc test nhanh chung (tham khảo)
- Web app:
  - `cd apps/web && npm run lint` (có thể fail do `next lint` trên Next 16 hiện tại)
  - `cd apps/web && npx eslint src --ext .ts,.tsx`
  - `cd apps/web && npx tsc --noEmit`
- SQL:
  - Chạy trên Supabase SQL Editor theo đúng thứ tự migration/seed
  - Test RLS bằng user role phù hợp (không chỉ test bằng service role)

## Gợi ý quản lý tiến độ
- Mỗi task khi hoàn thành nên cập nhật:
  - `progress/tasks.md` (bắt buộc)
  - trạng thái (`todo/in-progress/done`)
  - commit hash (nếu có)
  - file chính đã sửa
  - known gaps
- Mỗi file task root có sẵn mục `Cập nhật tiến độ` với lệnh mẫu `sed` + `cat >>` để ghi log vào `progress/tasks.md` (module tasks ghi vào file tiến độ module tương ứng).
