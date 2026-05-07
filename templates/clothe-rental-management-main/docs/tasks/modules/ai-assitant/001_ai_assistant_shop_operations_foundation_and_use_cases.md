# Task 072 - AI Assistant cho shop: nền tảng trợ lý vận hành + use case ưu tiên

## Input ban đầu
- Shop đã có dữ liệu vận hành đủ lớn ở các module:
  - sản phẩm, tồn kho, đơn hàng, thanh toán, nhập hàng, báo cáo.
- Nhiều tác vụ vẫn phụ thuộc thao tác thủ công:
  - tra cứu chính sách cho staff,
  - tư vấn sản phẩm theo nhu cầu khách,
  - kiểm tra lỗi dữ liệu trước khi commit,
  - tổng hợp tín hiệu vận hành hằng ngày cho quản lý.
- Yêu cầu từ business:
  - dùng AI để hỗ trợ tăng tốc vận hành, giảm lỗi thao tác, và cải thiện chất lượng phục vụ.

## Mục tiêu
- Bổ sung module `AI Assistant` theo hướng trợ lý hỗ trợ quyết định (assistive), không tự động ghi dữ liệu nghiệp vụ.
- Ưu tiên use case có tác động trực tiếp:
  - thời gian xử lý của staff,
  - tỷ lệ lỗi nhập liệu,
  - chất lượng tư vấn khách hàng,
  - tốc độ phát hiện vấn đề vận hành.
- Thiết kế theo kiến trúc hiện có: `Component -> Hook -> Query -> Service -> API/Supabase`.

## Nghiên cứu nhanh và kết luận áp dụng

### 1) AI hỗ trợ hội thoại có thể nâng năng suất nhóm chăm sóc khách
- Nghiên cứu thực nghiệm quy mô lớn trên nhóm hỗ trợ khách hàng cho thấy AI trợ lý hội thoại cải thiện năng suất xử lý.
- Hướng áp dụng cho shop:
  - trợ lý gợi ý câu trả lời cho staff bán hàng/chăm sóc khách,
  - chuẩn hóa chất lượng tư vấn giữa nhân sự mới và nhân sự lâu năm.

### 2) RAG phù hợp cho bài toán hỏi đáp chính sách và quy trình nội bộ
- Mô hình RAG bổ sung ngữ cảnh từ tài liệu ngoài mô hình, phù hợp với truy vấn vận hành theo chính sách cập nhật.
- Hướng áp dụng cho shop:
  - hỏi đáp chính sách thuê/trả/cọc/hoàn tác nhập hàng,
  - trả lời kèm trích dẫn nguồn tài liệu để staff kiểm chứng nhanh.

### 3) Function calling + Structured Outputs giúp tích hợp an toàn hơn
- Công cụ function calling và structured outputs giúp model trả dữ liệu theo schema xác định.
- Hướng áp dụng cho shop:
  - AI chỉ gọi các tool read-only cho tra cứu dữ liệu,
  - các action write bắt buộc đi qua bước xác nhận của người dùng.

### 4) File search/vector store phù hợp cho kho tri thức vận hành
- Hạ tầng vector store + file search giúp tìm kiếm ngữ nghĩa trên tài liệu đã upload.
- Hướng áp dụng cho shop:
  - kho tri thức cho SOP, hướng dẫn nhập liệu, chính sách thanh toán/đơn hàng.

### 5) Vision/PDF input phù hợp cho kiểm tra chứng từ và nhập hàng
- Model có thể đọc ảnh/PDF để trích xuất hoặc kiểm tra nội dung.
- Hướng áp dụng cho shop:
  - hỗ trợ staff đối soát chứng từ nhập hàng,
  - phát hiện thiếu cột hoặc giá trị bất thường trước commit.

### 6) Evals + safety framework là bắt buộc để vận hành ổn định
- Tài liệu best practices về eval/safety cho thấy cần đánh giá chất lượng định kỳ và có guardrail rõ ràng.
- Hướng áp dụng cho shop:
  - bộ eval nội bộ theo case thật,
  - theo dõi độ chính xác, độ an toàn, chi phí token và tỷ lệ fallback.

## Phụ thuộc
- `docs/tasks/016_settings_users_roles_general.md`
- `docs/tasks/034_staff_sales_pos_unified_module.md`
- `docs/tasks/063_global_status_localization_across_all_screens.md`
- `docs/tasks/066_procurement_product_input_upsert_and_excel_native_import.md`
- `docs/tasks/069_procurement_payment_integrity_and_immutable_intake_lines.md`
- `docs/tasks/052_revenue_debt_unified_calculation_dashboard_reports.md`

## Mapping màn hình/source
- Nền tảng AI assistant (new):
  - `apps/web/src/features/ai-assistant/components/**` (new)
  - `apps/web/src/features/ai-assistant/hooks/**` (new)
  - `apps/web/src/features/ai-assistant/queries/**` (new)
  - `apps/web/src/features/ai-assistant/services/**` (new)
  - `apps/web/src/features/ai-assistant/stores/**` (new)
  - `apps/web/src/types/aiAssistantModule.ts` (new)
- API/backend:
  - `apps/web/src/app/api/ai-assistant/**` (new)
  - `apps/web/src/server/services/aiAssistantService.ts` (new)
  - `apps/web/src/server/data-access/aiAssistant.ts` (new)
- Tích hợp settings:
  - `apps/web/src/features/settings/components/SettingsGeneralPage.tsx`
  - `apps/web/src/features/settings/hooks/useSettingsGeneralPage.ts`
  - `apps/web/src/server/services/settingsService.ts`
  - `apps/web/src/server/data-access/settings.ts`
- SQL:
  - `apps/web/sql/027_ai_assistant_core.sql` (new)
  - `apps/web/sql/README.md`

## Quy tắc nghiệp vụ bắt buộc
- `is_ai_assistant_enabled`:
  - chỉ `owner_admin/admin` được bật/tắt,
  - mặc định `false` sau migration.
- AI assistant chỉ là lớp đề xuất:
  - không tự động create/update/delete đơn hàng/sản phẩm/thanh toán,
  - mọi hành động có khả năng ghi dữ liệu phải có bước xác nhận tường minh từ user.
- Data isolation:
  - chỉ truy cập dữ liệu theo branch context hiện hành,
  - không trả dữ liệu cross-branch cho role không đủ quyền.
- An toàn dữ liệu:
  - che/mask thông tin nhạy cảm trước khi gửi prompt khi cần thiết,
  - log đầy đủ request/response metadata để audit.
- Tính sẵn sàng:
  - khi AI provider lỗi hoặc timeout, UI fallback về luồng thủ công hiện có, không block nghiệp vụ chính.

## In-scope (Task 072)
- Thiết lập nền tảng module AI assistant:
  - toggle settings + RBAC,
  - service/API skeleton,
  - logging và quota guard cơ bản.
- Triển khai 2 use case P1:
  - `Use case A`: Hỏi đáp tri thức vận hành (RAG + trích dẫn nguồn).
  - `Use case B`: Copilot kiểm tra dữ liệu nhập hàng trước commit (gợi ý lỗi/thiếu/bất thường).
- Thêm bộ eval baseline cho 2 use case trên.

## Out-of-scope
- Tự động chốt đơn hoặc tự động tạo giao dịch tài chính không cần xác nhận người dùng.
- Dynamic pricing tự động theo thời gian thực.
- Tích hợp chatbot đa kênh hoàn chỉnh (Zalo/Facebook/Call center) ở giai đoạn này.
- Huấn luyện/fine-tune model riêng.

## KPI đề xuất để đo hiệu quả sau triển khai
- Vận hành:
  - giảm thời gian trung bình xử lý câu hỏi chính sách của staff.
  - giảm tỷ lệ lỗi nhập hàng bị phát hiện sau commit.
- Chất lượng:
  - tỷ lệ câu trả lời có trích dẫn nguồn hợp lệ.
  - tỷ lệ staff chấp nhận gợi ý AI (accept rate).
- Độ tin cậy:
  - tỷ lệ fallback thủ công khi AI lỗi.
  - latency p95 của phản hồi AI trong giờ cao điểm.
- Chi phí:
  - chi phí token theo ngày/chi nhánh/use case.

## Prompt gợi ý cho Codex
```text
Mục tiêu: triển khai Task 072 - nền tảng AI assistant + 2 use case P1 (RAG tri thức + kiểm tra dữ liệu nhập hàng trước commit).

Yêu cầu:
1) Thêm toggle `is_ai_assistant_enabled` trong settings (default false) + migration SQL.
2) Tạo feature `ai-assistant` theo đúng kiến trúc Component -> Hook -> Query -> Service -> API/Supabase.
3) Use case A: hỏi đáp tri thức có trích dẫn tài liệu nguồn (RAG/file search).
4) Use case B: kiểm tra dữ liệu import/nhập hàng trước commit, chỉ đưa gợi ý, không tự ghi DB.
5) Thêm log/audit metadata, error handling, fallback, và eval baseline.
6) Không phá vỡ flow auth/anon/offline hiện tại.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Có migration + wiring settings cho `is_ai_assistant_enabled`.
- Có module `ai-assistant` với API/hook/UI hoạt động được ở mức P1.
- RAG trả lời có trích dẫn nguồn từ kho tri thức.
- Copilot nhập hàng phát hiện và trả về danh sách cảnh báo theo schema.
- Có logging/audit cơ bản cho request AI và kết quả tool call.
- Có bộ eval baseline và tài liệu cách chạy eval.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Toggle OFF:
  - màn AI assistant không cho thao tác, nghiệp vụ chính vẫn chạy bình thường.
- Toggle ON:
  - hỏi đáp chính sách trả lời đúng ngữ cảnh branch + có trích dẫn.
  - dữ liệu nhập hàng lỗi rõ ràng được cảnh báo trước commit.
- Role check:
  - staff chỉ dùng AI trong phạm vi branch được cấp.
  - owner_admin/admin quản trị được toggle và quota.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 072 thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 071 /a - [ ] 072 | AI assistant foundation for shop operations: settings toggle + RAG policy QA + procurement pre-commit copilot | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 072 |- [x] 072 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 072
  - Task file: docs/tasks/modules/ai-assitant/001_ai_assistant_shop_operations_foundation_and_use_cases.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~

## Tham chiếu nghiên cứu
- Generative AI at Work (NBER Working Paper 31161):
  - https://www.nber.org/papers/w31161
- Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks (NeurIPS 2020):
  - https://arxiv.org/abs/2005.11401
- OpenAI Structured Outputs:
  - https://openai.com/index/introducing-structured-outputs-in-the-api/
- OpenAI Function Calling Guide:
  - https://platform.openai.com/docs/guides/function-calling
- OpenAI File Search / Retrieval:
  - https://platform.openai.com/docs/guides/tools-file-search
  - https://platform.openai.com/docs/guides/retrieval
- OpenAI File Inputs (PDF) và Images/Vision:
  - https://platform.openai.com/docs/guides/pdf-files
  - https://platform.openai.com/docs/guides/images-vision
- OpenAI Evaluation Best Practices:
  - https://platform.openai.com/docs/guides/evaluation-best-practices
- OpenAI Prompt Caching / Cost Optimization:
  - https://platform.openai.com/docs/guides/prompt-caching
  - https://platform.openai.com/docs/guides/cost-optimization
- NIST AI RMF 1.0:
  - https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10
- NIST AI RMF Generative AI Profile (NIST AI 600-1):
  - https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence
