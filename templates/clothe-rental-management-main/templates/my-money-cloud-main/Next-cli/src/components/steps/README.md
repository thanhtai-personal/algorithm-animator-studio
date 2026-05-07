# FormSteps (compound multi-step form)

Tài liệu ngắn gọn (tiếng Việt) để tái sử dụng `FormSteps` trong web app.

## Mục đích
- Tạo flow nhiều bước (wizard) chỉ với UI/state client.
- Điều phối bước bằng linked-list (next/prev) và expose imperative handle cho cha nếu cần.
- Cho phép tùy biến header/footer và truyền validation cho từng bước.

## API chính
- Component: `FormSteps`
  - Props:  
    - `open: boolean`, `onClose: () => void`  
    - `initialStepKey?: StepKey` (mặc định step đầu tiên)  
    - `onSubmit?: () => void | Promise<void>` (gọi ở bước cuối sau validate)  
    - `onStepChange?: (key: StepKey) => void`  
    - `labels: { back; next; done; submitting? }`
  - Subcomponents:  
    - `FormSteps.Step`: định nghĩa 1 bước  
      - `stepKey: StepKey`, `title: string`, `validate?: () => boolean | Promise<boolean>`  
      - `children`: `ReactNode` hoặc `(ctx: StepRenderContext) => ReactNode`
    - `FormSteps.Header`: tùy biến header (nếu không truyền sẽ dùng title mặc định)
    - `FormSteps.Footer`: tùy biến footer (nếu không truyền sẽ render nút Back/Next/Done)
    - `FormSteps.Steps`: tùy chọn bọc danh sách Step
  - Ref (forwardRef): `StepFormHandle`
    - `goNext()`, `goPrev()`, `goTo(key)`, `reset()`
    - `getCurrentKey()`
    - `setStepData(key, value)`, `getStepData<T>(key)`

- `StepRenderContext` (truyền vào children nếu dùng render-prop):
  - `currentKey`, `goNext`, `goPrev`, `goTo`
  - `setStepData(key, value)`, `getStepData<T>(key)`

## Ví dụ nhanh
```tsx
const formRef = useRef<StepFormHandle>(null);

<FormSteps
  ref={formRef}
  open={open}
  onClose={onClose}
  initialStepKey="amount"
  onSubmit={handleSubmit}
  labels={{ back: t("back"), next: t("next"), done: t("done"), submitting: t("loading") }}
>
  <FormSteps.Step
    stepKey="amount"
    title={t("amount")}
    validate={() => amount > 0}
  >
    {(ctx) => <AmountUI onNext={ctx.goNext} />}
  </FormSteps.Step>

  <FormSteps.Step
    stepKey="review"
    title={t("review")}
  >
    <ReviewUI data={...} />
  </FormSteps.Step>
</FormSteps>
```

## Lưu ý MCP
- `FormSteps` chỉ nằm ở `src/components/steps/` (UI, state client). Không chứa service/server logic.
- Validation chỉ chạy trên client; mọi xử lý server gọi ở `onSubmit` từ feature (được truyền vào).
- Không import store/service trực tiếp vào `FormSteps`; chỉ truyền data/handler qua props.
