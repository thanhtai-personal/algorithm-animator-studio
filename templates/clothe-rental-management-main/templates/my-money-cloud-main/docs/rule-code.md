## Tiêu chuẩn kiến trúc dự án My Money Cloud

### Cấu trúc hiện tại (Transitional)
Dự án sử dụng cấu trúc đơn giản cho các màn hình chính:
- `src/pages/` - Các trang chính của ứng dụng
- `src/components/` - Các component UI được tổ chức theo danh mục
- `src/hooks/` - Custom hooks cho logic xử lý
- `src/types/` - Định nghĩa TypeScript interfaces
- `src/lib/` - Utility functions và helpers

### Cấu trúc đích (Feature-based - áp dụng khi mở rộng tính năng)

Khi thêm một feature mới (ví dụ: budget management, investment tracking), tuân theo cấu trúc sau:

```
src/features/<tên_tính_năng>/
├── services/          # Gọi API, nếu chưa có API thì mock data
├── queries/           # TanStack Query hooks (useXyzQuery, useXyzMutation)
├── hooks/             # Custom hooks quản lý state logic
├── components/        # React components render UI
├── adapters/          # Format dữ liệu API ↔ Frontend (adapter pattern)
├── types/             # TypeScript types/interfaces cho feature này
├── constants.ts       # Hằng số của feature
├── utils.ts           # Hàm hỗ trợ tiện ích
├── data/
│   └── mock.ts        # Mock data cho testing/development
├── index.tsx          # Entry point - dàn trang chính
└── README.md          # Tài liệu feature (cách dùng, structure logic)
```

### Chi tiết từng folder

#### `services/`
- Nơi tập trung gọi API (axios, fetch)
- Nếu chưa có API thực, import mock data từ `data/mock.ts`
- Ví dụ: `transactionService.ts`, `walletService.ts`

#### `queries/`
- Wrapper TanStack Query cho service
- Tách query keys ra file `keys.ts` để dễ invalidate cache
- Ví dụ: `useTransactionsQuery`, `useUpdateTransactionMutation`
- **Query key guideline**: Dùng constant thay vì hard-code string arrays
  ```typescript
  // queries/keys.ts
  export const transactionQueryKeys = {
    all: ['transactions'] as const,
    lists: () => [...transactionQueryKeys.all, 'list'] as const,
    list: (filters) => [...transactionQueryKeys.lists(), filters] as const,
    details: () => [...transactionQueryKeys.all, 'detail'] as const,
    detail: (id) => [...transactionQueryKeys.details(), id] as const,
  };
  ```

#### `hooks/`
- Custom hooks quản lý state logic + gọi queries
- Hook chỉ có 1 trách nhiệm nhưng độc lập hoàn toàn
- Ví dụ: `useTransactionForm`, `useTransactionList`, `useTransactionFilters`
- Component chỉ gọi hook để lấy dữ liệu + hành động, không có business logic

#### `components/`
- Components chỉ phụ trách render UI
- Gọi hooks để lấy data + handlers
- Phản ánh rõ ràng các thành phần trên UI
- Có thể tách thành subfolder nếu phức tạp (ví dụ `components/forms/`, `components/tables/`)
- Props được typed rõ ràng (không dùng PropTypes)

#### `adapters/`
- Format dữ liệu API response về shape frontend mong muốn
- Sử dụng adapter pattern: cung cấp hàm convert và revert
- Ví dụ: `transactionResponseAdapter.ts`
  ```typescript
  export const transactionAdapter = {
    toDTO: (apiData) => ({ /* map về frontend */ }),
    fromDTO: (frontendData) => ({ /* map về API */ }),
  };
  ```
- Gọi trong layer `services` hoặc `queries`, **không gọi trực tiếp từ component**

#### `types/`
- TypeScript interfaces/types của feature
- Không mix với types của feature khác

#### `constants.ts`, `utils.ts`
- Hằng số và hàm tiện ích của feature
- Tách riêng để dễ maintain

#### `data/mock.ts`
- Mock data phục vụ development/testing
- Structure giống response thực từ API

#### `index.tsx`
- Export page component chính của feature
- Dàn trang: gọi components con, wire props
- Quản lý layout + routing cấp feature

### Quy tắc coding chung

1. **React 18+ best practices**
   - Dùng hooks (không dùng class components)
   - Optimize render với `React.memo`, `useMemo`, `useCallback` khi cần
   - Avoid prop drilling: dùng context hoặc hooks tùy tình huống

2. **Kích thước file**
   - Mục tiêu: ≤ 400 dòng/file
   - Tách logic, data, và UI render ra các file riêng

3. **TypeScript**
   - Định nghĩa prop types bằng `type`/`interface`, **không dùng PropTypes**
   - Explicit type annotations cho props của components
   - Ví dụ:
     ```typescript
     interface TransactionFormProps {
       transaction?: Transaction;
       onSubmit: (data: Transaction) => Promise<void>;
       isLoading?: boolean;
     }
     export function TransactionForm({ transaction, onSubmit, isLoading }: TransactionFormProps) {
       // ...
     }
     ```

4. **Tách biệt concerns**
   - **Hook layer**: Quản lý state, gọi API, xử lý business logic
   - **Component layer**: Nhận data + callbacks từ hook, chỉ phụ trách render
   - **Page layer**: Dàn trang, wire components với state từ hooks

5. **UI phức tạp**
   - Tách render logic thành components nhỏ, tái sử dụng
   - Ví dụ: Form phức tạp → `FormField`, `FormSection`, `FormActions` components

6. **Code quality**
   - SOLID principles (Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion)
   - DRY (Don't Repeat Yourself)
   - Tránh side effects không cần thiết
   - Xóa/comment code chưa dùng

7. **Performance**
   - Optimize infinite scroll / large list rendering
   - Lazy load components khi cần
   - Memoize expensive computations
   - Tối ưu re-renders

8. **Tránh breaking changes**
   - Hạn chế sửa code chung (shared utils, hooks) hoặc của feature khác
   - Nếu phải sửa, phải kiểm tra impact

9. **Code comments**
   - Comment props của components có logic phức tạp
   - Comment hàm helper không rõ ràng
   - Tránh comment quá dài; code nên tự giải thích

10. **List/Array keys**
    - Luôn có unique `key` prop khi render arrays
    - Không dùng index làm key (trừ danh sách static)

11. **Code formatting**
    - Tự động format theo Prettier rules (file `.prettierrc`)
    - Chạy `npm run lint` trước commit

### Thứ tự gọi API khi triển khai feature mới

```
Component
    ↓
Hook (useMyFeature, useMyFeatureForm, etc.)
    ↓
Query (useMyFeatureMutation, useMyFeatureQuery)
    ↓
Service (myFeatureService.ts)
    ↓
API (axios/fetch) + Adapter (format request/response)
```

**Nguyên tắc**: Component không bao giờ gọi service trực tiếp; luôn đi qua hook → query → service

### Naming conventions

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Query hook | `use<Feature>Query` | `useTransactionsQuery`, `useWalletQuery` |
| Mutation hook | `use<Action>Mutation` | `useCreateTransactionMutation`, `useUpdateWalletMutation` |
| Custom hook | `use<Logic>` | `useTransactionForm`, `useTransactionFilters` |
| Service | `<feature>Service` | `transactionService`, `walletService` |
| Component | PascalCase | `TransactionList`, `TransactionForm`, `BalanceCard` |
| Type/Interface | PascalCase | `Transaction`, `Wallet`, `DashboardStats` |
| Constant | UPPER_SNAKE_CASE | `DEFAULT_CATEGORIES`, `MAX_TRANSACTIONS_PER_PAGE` |
| Utility function | camelCase | `formatCurrency`, `calculateBalance` |

### Testing

- Unit test cho hooks (test state changes + API calls)
- Integration test cho features (end-to-end flow)
- Mock service/queries trong tests
- Đặt test files cạnh file source: `component.test.ts`, `hook.test.ts`

### Git workflow

- Branch per feature: `feature/transaction-budget`, `feature/investment-tracking`
- Commit message: `feat: add transaction filters`, `fix: wallet balance calculation`
- Keep commits atomic and meaningful
