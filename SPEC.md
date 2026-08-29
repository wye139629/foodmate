# SPEC.md — FoodMate(食材共享平台)

> 這份文件是所有 AI agent(planner / builder / reviewer)開工前必須先讀的唯一真相來源(single source of truth)。
> 如果任何地方模糊不清,agent 應該標記 `[NEEDS CLARIFICATION: ...]` 並停下來問,而不是自己猜。

---

## 1. Context(背景)

專案名稱:**FoodMate**
黑客松主題:Food or Ingredients Sharing。
使用者可以設定自己願意分享的食物/食材,系統在地圖上顯示附近可分享的項目,使用者間可以透過 1 對 1 聊天協調領取,最後約定見面完成分享。核心流程:設定可分享項目 → 地圖瀏覽附近項目 → 聊天協調 → 見面分享。

## 2. Goal(目標)

做出一個可在 demo 中完整跑通的 MVP:
使用者登入 → 建立一筆可分享食材(含位置)→ 另一使用者在地圖上看到附近項目 → 發起 1 對 1 聊天請求 → 雙方協調見面 → 標記完成分享。

## 3. Tech Stack(技術選型 — 已鎖定,agent 不可更改)

| 項目 | 選擇 | 原因 |
|---|---|---|
| Full-stack framework | Next.js (App Router, TypeScript) | 與其他候選題目共用同一套骨架 |
| Database / Auth | Supabase (Postgres + Auth + Realtime) | 需要真實使用者身份才能聊天與約定見面,Auth 為必要項目(非可選) |
| 即時聊天 | Supabase Realtime(Postgres changes 訂閱) | 不用額外導入 WebSocket 服務,與既有 stack 一致 |
| 地圖 | Google Maps JavaScript API | 顯示附近可分享項目、取得使用者目前位置 |
| 部署 | Vercel | git push 自動部署 |

**Non-negotiable(憲法等級規則,agent 不可違反)：**
- 建立分享項目、發起聊天、查看地圖都**必須登入**才能操作(與其他候選題目不同,此專案不可做成匿名可用)
- 地理位置計算**不使用 PostGIS 或複雜地理查詢**,MVP 階段用簡單經緯度距離公式(Haversine)在應用層計算即可,不引入額外地理資料庫套件
- 涉及真人見面的畫面,**必須顯示安全提醒**(建議公開場所見面、見面前先確認對方),此為 UI 必要元素,不可省略
- 不做金流/付費機制(此為純分享,非交易平台)

## 4. Scope 邊界(避免 agent 互相踩檔案)

| Agent 角色 | 負責範圍 | 禁止觸碰 |
|---|---|---|
| Auth/Backend agent | `/app/api/**`,Supabase schema(users, listings, chats, messages 資料表),Auth 設定 | UI component 檔案 |
| Map/Listing agent | `/components/MapView.tsx`,`/components/ListingForm.tsx`,`/components/ListingCard.tsx`,對應的 `/app/api/listings/**` | Chat 相關檔案 |
| Chat agent | `/components/ChatWindow.tsx`,`/app/api/chat/**`,Supabase Realtime 訂閱邏輯 | Map/Listing 相關檔案 |
| Reviewer agent | 對照本文件 Acceptance Criteria 執行驗收 | 不可修改 scope 以外的功能 |

## 5. User Stories(MVP,含優先順序)

### P1 — 必須完成(demo 的骨架)

**FR-001｜使用者登入**
- **Given** 使用者第一次進入 app
- **When** 使用者用 email/密碼(或 Supabase 支援的簡易登入方式)註冊/登入
- **Then** 系統建立/識別該使用者身份,後續所有操作(建立項目、聊天)都綁定此身份

**FR-002｜設定可分享項目**
- **Given** 使用者已登入
- **When** 使用者填寫要分享的食物/食材(名稱、數量描述、可選照片、目前位置)並送出
- **Then** 系統將此項目存入資料庫,標記為「可分享中」狀態,並綁定該使用者的地理位置

**FR-003｜地圖顯示附近可分享項目**
- **Given** 使用者已登入,並授權瀏覽器取得目前位置
- **When** 使用者開啟地圖頁面
- **Then** Google Maps 上顯示以使用者目前位置為中心、附近所有「可分享中」狀態的項目標記,點擊標記可看到項目詳情

**FR-004｜1 對 1 聊天請求**
- **Given** 使用者在地圖或列表上看到感興趣的項目
- **When** 使用者點擊「聯絡分享者」
- **Then** 系統建立(或開啟既有)該使用者與分享者之間的 1 對 1 聊天室,雙方可即時傳送訊息(透過 Supabase Realtime)

**FR-005｜標記見面完成分享**
- **Given** 雙方已在聊天中協調完成
- **When** 分享者(項目擁有者)標記該項目為「已分享完成」
- **Then** 該項目從地圖上的「可分享中」列表移除,狀態更新為已完成,雙方在聊天室看到狀態更新提示

### P2 — 有時間再做

**FR-006｜安全提醒顯示**
- **Given** 使用者進入聊天室或準備標記見面
- **When** 畫面顯示見面相關資訊
- **Then** 顯示明確的安全提醒文字(建議公開場所見面、見面前先確認對方身份)

**FR-007｜項目篩選/分類**
- **Given** 使用者在地圖/列表頁面
- **When** 使用者選擇篩選條件(例如食材類別、距離範圍)
- **Then** 畫面只顯示符合條件的項目

### P3 — 錦上添花

**FR-008** 使用者評價/信譽紀錄(完成分享後互相評分)
**FR-009** 項目到期時間設定(食物新鮮度提醒)
**FR-010** 收藏/追蹤感興趣的項目

## 6. Acceptance Criteria 總覽(Reviewer agent 驗收用)

- [ ] FR-001~005 全部跑通即視為 demo-ready(最低可展示門檻)
- [ ] 未登入使用者不可存取建立項目、聊天、查看聯絡資訊等功能(需有明確導向登入頁的行為,不可白屏或報錯)
- [ ] 地圖標記位置需對應真實經緯度資料,不可寫死假資料在地圖上
- [ ] 聊天訊息需為即時更新(對方傳送後,不需重新整理頁面即可看到),需實測驗證 Supabase Realtime 訂閱正常運作
- [ ] 項目狀態變更(可分享中 → 已完成)需正確反映在地圖與雙方畫面上

## 7. Open Questions(待確認,implementation 前需解決)

- [NEEDS CLARIFICATION: Google Maps API key 是否已申請?需要在開工前完成註冊,並確認免費額度(Google Maps 有月費用額度限制,demo 用量應該足夠,但需要先設定計費帳戶才能取得 key)]
- [NEEDS CLARIFICATION: 使用者位置是即時抓取(每次開地圖都問一次),還是在個人資料設定一個固定位置?建議 MVP 先用「每次開地圖時抓取當下位置」,較簡單]
- [NEEDS CLARIFICATION: 聊天室是否需要通知機制(有新訊息時提醒)?P1 階段建議先不用推播通知,使用者需自己開啟聊天室查看]
- [NEEDS CLARIFICATION: 附近範圍的距離門檻抓多少公里?demo 時測試資料是否會分散在合理範圍內,需要提前準備測試帳號與假資料驗證地圖顯示效果]

## 8. Definition of Done(給 agent 的終止條件)

一個 task 被視為「完成」,只有當:
1. 對應的 Given-When-Then 驗收條件實測通過(不是 agent 自己聲稱通過)
2. 沒有超出該 agent 的 Scope 邊界
3. Reviewer agent 或 William 本人手動確認一次 happy path(至少準備兩個測試帳號,模擬「分享者建立項目」跟「領取者透過地圖找到並聊天」的完整流程)
