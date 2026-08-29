# tasks.md — FoodMate(原子任務拆解)

> 對應 `SPEC_food_sharing.md`。每個 task 必須照 `CLAUDE.md` 的執行流程走:實作 → 跑測試 → 通過才 commit。
> `CLAUDE.md` 是共用檔案,不用重寫,直接放在這個專案根目錄即可。

---

## T000｜專案初始化(前置作業,不對應特定 FR)

- **內容**:建立 Next.js (App Router, TypeScript) 專案骨架(專案/package 名稱設為 `foodmate`)、設定 Supabase 連線與資料表(`users`(沿用 Supabase Auth 內建)、`listings`:項目名稱/描述/照片URL/經緯度/狀態/owner_id、`chats`:雙方 user_id、`messages`:chat_id/sender_id/content/created_at)、啟用 Supabase Realtime 於 `messages` 表、設定 `.env.example`(含 Google Maps API key 欄位)、設定測試框架、App 標題/metadata 設為「FoodMate」
- **檔案範圍**:專案根目錄設定檔、`/app/layout.tsx`、`.env.example`、Supabase schema migration 檔
- **測試指令**:`npm run build`
- **Commit message**:`chore: 專案初始化與 Supabase schema 設定`
- **Rollback**:`git reset --hard` 回到 init commit 前

---

## T001｜FR-001 使用者登入

- **前置**:T000 完成
- **內容**:
  - 建立註冊/登入頁面,串接 Supabase Auth
  - 建立 middleware 或 route guard,確保未登入使用者無法存取需要身份的頁面(建立項目、聊天、地圖)
- **檔案範圍**:`/app/login/page.tsx`,`/app/signup/page.tsx`,`/middleware.ts`,`/lib/supabase-auth.ts`
- **測試指令**:`npm test -- auth.test.ts`(驗證未登入使用者存取受保護路由時被導向登入頁;驗證登入成功後可正常存取)
- **Acceptance 對應**:SPEC_food_sharing.md FR-001、Acceptance 總覽「未登入使用者不可存取」
- **Commit message**:`feat(FR-001): 使用者登入與路由保護`
- **Rollback**:`git revert <commit-hash>`

---

## T002｜FR-002 設定可分享項目(可與 T003 平行開發,見底部規劃)

- **前置**:T001 完成
- **內容**:
  - 建立分享項目表單元件(名稱、數量描述、照片上傳可選、自動帶入目前位置經緯度)
  - 建立 `/app/api/listings` POST route,將項目存入 `listings` 表,綁定登入使用者 id,狀態預設為「可分享中」
- **檔案範圍**:`/components/ListingForm.tsx`,`/app/api/listings/route.ts`
- **測試指令**:`npm test -- listing-create.test.ts`(驗證表單送出後正確呼叫 API;驗證 API 正確寫入資料庫並綁定 owner_id;驗證未帶經緯度時的錯誤處理)
- **Acceptance 對應**:SPEC_food_sharing.md FR-002
- **Commit message**:`feat(FR-002): 設定可分享項目`
- **Rollback**:`git revert <commit-hash>`

---

## T003｜FR-003 地圖顯示附近可分享項目

- **前置**:T001 完成(不依賴 T002 的表單 UI,只需要 `listings` 資料表結構,可平行開發並用假資料先串接)
- **內容**:
  - 整合 Google Maps JavaScript API,顯示地圖並取得使用者目前位置(瀏覽器 Geolocation API)
  - 建立 `/app/api/listings/nearby` route,輸入使用者經緯度,用 Haversine 公式計算距離,回傳範圍內的「可分享中」項目
  - 地圖上顯示項目標記,點擊標記顯示詳情
- **檔案範圍**:`/components/MapView.tsx`,`/app/api/listings/nearby/route.ts`,`/lib/geo-distance.ts`
- **測試指令**:
  - `npm test -- geo-distance.test.ts`(驗證 Haversine 距離計算公式正確性,用已知經緯度對照已知距離數值測試)
  - `npm test -- nearby-listings.test.ts`(mock 資料庫回傳多筆不同距離的項目,驗證 API 正確篩選出範圍內項目、排除範圍外項目)
- **Acceptance 對應**:SPEC_food_sharing.md FR-003、Acceptance 總覽「地圖標記需對應真實經緯度資料」
- **Commit message**:`feat(FR-003): 地圖顯示附近可分享項目`
- **Rollback**:`git revert <commit-hash>`

---

## T004｜FR-004 1 對 1 聊天請求

- **前置**:T001 完成(不依賴 T002/T003,可平行開發,聊天邏輯與項目/地圖邏輯無耦合,只需要 listing_id 與 owner_id 當作發起聊天的參數)
- **內容**:
  - 建立「聯絡分享者」按鈕邏輯:若該使用者與 owner 之間尚無聊天室,建立一筆 `chats` 紀錄;若已存在,直接開啟
  - 建立聊天室 UI,訂閱 Supabase Realtime 監聽 `messages` 表新增事件,即時顯示新訊息
  - 建立 `/app/api/chat/send` route,寫入訊息
- **檔案範圍**:`/components/ChatWindow.tsx`,`/app/api/chat/**`
- **測試指令**:
  - `npm test -- chat-create.test.ts`(驗證重複點擊「聯絡分享者」不會建立重複聊天室,而是開啟既有的)
  - `npm test -- chat-realtime.test.ts`(驗證訊息寫入後,Realtime 訂閱端能收到更新事件 — 可用 Supabase local emulator 或 mock 驗證訂閱邏輯有被正確觸發)
- **Acceptance 對應**:SPEC_food_sharing.md FR-004、Acceptance 總覽「聊天訊息需為即時更新」
- **Commit message**:`feat(FR-004): 1 對 1 聊天功能`
- **Rollback**:`git revert <commit-hash>`

---

## T005｜FR-005 標記見面完成分享(需整合 T002、T003、T004 成果)

- **前置**:T002、T003、T004 完成且已 merge 回同一條線
- **內容**:
  - 建立「標記已完成分享」按鈕(僅 owner 可操作),更新 `listings` 狀態
  - 地圖與列表即時反映狀態變更(已完成項目從「可分享中」列表移除)
  - 聊天室內顯示狀態更新提示訊息
- **檔案範圍**:`/app/api/listings/complete/route.ts`,`/components/ListingCard.tsx`(擴充,不可整個重寫),`/components/ChatWindow.tsx`(擴充狀態提示,不可整個重寫)
- **測試指令**:`npm test -- listing-complete.test.ts`(驗證非 owner 呼叫此 API 會被拒絕;驗證狀態更新後,nearby-listings API 不再回傳此項目)
- **Acceptance 對應**:SPEC_food_sharing.md FR-005、Acceptance 總覽「項目狀態變更需正確反映」
- **Commit message**:`feat(FR-005): 標記見面完成分享`
- **Rollback**:`git revert <commit-hash>`

---

## P2 task(P1 全部完成、William 確認後才開始)

## T006｜FR-006 安全提醒顯示
- **前置**:T004、T005 完成
- **測試指令**:`npm test -- safety-notice.test.tsx`
- **Commit message**:`feat(FR-006): 安全提醒顯示`

## T007｜FR-007 項目篩選/分類
- **前置**:T003 完成
- **測試指令**:`npm test -- listing-filter.test.ts`
- **Commit message**:`feat(FR-007): 項目篩選功能`

---

## 執行順序與平行開發規劃

```
T000(必須先做)
  ├── T001(登入,所有其他 task 的共同前置)
  │
  ├── worktree A(branch: feature/listings)
  │     T002(建立項目表單)
  │
  ├── worktree B(branch: feature/map)
  │     T003(地圖顯示,可先用假資料開發,不等 T002)
  │
  ├── worktree C(branch: feature/chat)
  │     T004(聊天,只需 listing_id/owner_id 參數,可平行開發)
  │
  └── T005(需等 A、B、C 三線都 merge 回 main 後,在 main 上做)
```

**重要**:T003、T004 開工前,`listings` 資料表的欄位格式(id, name, lat, lng, status, owner_id)必須先在 T000 就定義清楚並讓三條線的 agent 都看到同一份 schema,不可各自臨時決定格式,否則 T005 整合時會對不上。

## P1 完成後的人工驗證清單(對應 CLAUDE.md 第 7 節)

全部 T000-T005 測試通過並 merge 回 main 後,William 本人需準備**兩個測試帳號**,手動執行一次完整 happy path:
1. 帳號 A 登入 → 建立一筆可分享項目(填入實際可測試的經緯度)
2. 帳號 B 登入 → 開啟地圖,確認能看到帳號 A 的項目標記 → 點擊「聯絡分享者」發起聊天 → 傳送訊息,確認帳號 A 端即時收到
3. 帳號 A 標記該項目為已完成 → 確認地圖上項目消失、聊天室顯示狀態提示
4. 確認整個流程在 Vercel 部署環境(不只 localhost)也能跑通,特別注意 Google Maps API key 在正式網域下的授權設定是否正確
