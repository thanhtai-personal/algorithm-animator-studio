1️⃣ CLONE STORE (MobX / Zustand / Redux)
✅ Clone được 100%

Được clone nguyên trạng:

Business state

Actions

Computed

Side-effects (nếu không phụ thuộc DOM)

❌ Không được chứa:

window

document

localStorage

Web-only API

🔁 Thay thế storage adapter
// packages/core/storage/storageAdapter.ts
export interface StorageAdapter {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
}

Web
export const webStorage: StorageAdapter = {
  get: (k) => Promise.resolve(localStorage.getItem(k)),
  set: (k, v) => Promise.resolve(localStorage.setItem(k, v)),
}

Mobile
import AsyncStorage from "@react-native-async-storage/async-storage"

export const nativeStorage: StorageAdapter = {
  get: (k) => AsyncStorage.getItem(k),
  set: (k, v) => AsyncStorage.setItem(k, v),
}


📌 Store chỉ gọi adapter, không biết đang ở web hay mobile.

2️⃣ CLONE HOOK (Business Hooks)
✅ Clone được 80–90%
Clone được:

Data fetching hooks

Logic hooks

Validation hooks

Auth logic

Không clone trực tiếp:

Hooks dùng DOM (useRef<HTMLInputElement>)

Hooks dùng router Next.js

🔁 Router abstraction
// packages/core/router/router.ts
export interface AppRouter {
  push(path: string): void
  replace(path: string): void
}

Web
import { useRouter } from "next/navigation"

export const useWebRouter = (): AppRouter => {
  const r = useRouter()
  return {
    push: r.push,
    replace: r.replace,
  }
}

Mobile
import { useNavigation } from "@react-navigation/native"

export const useNativeRouter = (): AppRouter => {
  const nav = useNavigation()
  return {
    push: (p) => nav.navigate(p as never),
    replace: (p) => nav.reset({ index: 0, routes: [{ name: p }] }),
  }
}

3️⃣ CLONE CSS ❌ (KHÔNG CLONE – CHUYỂN ĐỔI)

CSS KHÔNG CLONE – CHỈ CHUYỂN TƯ DUY

Mapping tư duy
Web (CSS)	React Native
margin / padding	margin / padding
flexbox	flexbox
gap	❌ không có
rem / px	number
hover	❌
media query	Dimensions / useWindowDimensions
Chuẩn hóa style Native
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
})


📌 Không cố mô phỏng web pixel-perfect

4️⃣ CLONE COMPONENT (REWRITE CÓ KIỂM SOÁT)
❌ Không clone JSX trực tiếp
✅ Clone theo bảng mapping
Web	React Native
div	View
span	Text
img	Image
button	Pressable
input	TextInput
a	Pressable + Linking
Ví dụ
Web
<button onClick={onSubmit}>Save</button>

Native
<Pressable onPress={onSubmit}>
  <Text>Save</Text>
</Pressable>


📌 Logic giữ nguyên – UI viết lại

5️⃣ DATA FETCHING (TanStack Query)
✅ Clone 100%

Query key

Service call

Retry / cache

Chỉ thay:

Network adapter (fetch / axios OK)

Token storage

6️⃣ AUTH FLOW – ĐIỂM DỄ TOANG NHẤT
Bắt buộc:

AuthStore dùng chung

Token lưu qua adapter

Không phụ thuộc cookie

Flow chuẩn:
App Start
 └─ load token
     ├─ valid → Home
     ├─ invalid → Login
     └─ anon → Onboarding


📌 Mobile không có cookie → luôn dùng token explicit.

7️⃣ CHECKLIST CLONE APP (BẮT BUỘC ĐI QUA)
Core

 Store dùng adapter

 Hook không dùng DOM

 Service thuần TS

Web

 Router Next

 localStorage

 CSS module

Mobile

 React Navigation

 AsyncStorage

 StyleSheet

8️⃣ NGUYÊN TẮC VÀNG (RẤT QUAN TRỌNG)

Không copy UI → rewrite

Logic nằm ngoài app

Store không biết platform

Hook không biết router

UI chỉ là shell