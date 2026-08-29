# CLAUDE.md — 專案執行規則(Claude Code 開工前必讀)

這份文件跟 `SPEC.md`、`tasks.md` 一起讀。三份文件的關係:
- `SPEC.md` = 要做什麼、為什麼(user stories, acceptance criteria)
- `tasks.md` = 拆解成哪些原子任務,每個任務怎麼驗證
- `CLAUDE.md`(本文件) = 執行時必須遵守的規則,不管做哪個 task 都適用

---

## 1. 執行流程(每個 task 都要照這個順序做,不可跳步驟)

對於 `tasks.md` 裡的每一個 task:

1. 閱讀該 task 對應的 `SPEC.md` FR 條目,確認 acceptance criteria
2. 檢查是否有 `[NEEDS CLARIFICATION]` 標記 — 如果有,**立刻停下來問我,不要自己猜著做**
3. 只在該 task 指定的檔案/資料夾範圍內修改(見 SPEC.md 第 4 節 Scope 邊界)
4. 實作完成後,執行該 task 指定的測試指令
5. **測試沒有全部通過,不可以 commit**。回頭修,修到過為止(最多重試 3 次；3 次都失敗,停下來跟我報告卡在哪裡,不要無限重試)
6. 測試通過後,用 task 指定的 commit message 格式做 git commit
7. commit 前,自我檢查並在回報中列出:這次改動的檔案清單,是否都在允許的 scope 內
8. 進下一個 task

## 2. 「完成」的唯一判定標準

一個 task **不是**你覺得做完了就算完成,而是必須同時滿足:
- [ ] 對應的自動化測試指令執行結果為 **通過**(不是你用文字描述「應該可以動」)
- [ ] 沒有修改到 scope 範圍外的檔案
- [ ] 已經 commit,commit message 符合指定格式

如果測試沒有涵蓋到某個 acceptance criteria(例如語意/邏輯合理性這種難自動化的部分),要在回報中**明確說明**「這部分需要人工驗證」,不要假裝有測過。

## 3. 遇到不確定時的規則

- 如果 `SPEC.md` 裡有 `[NEEDS CLARIFICATION: ...]` 且跟目前 task 有關,**停下來問我**,不要猜一個答案繼續做
- 如果測試指令本身跑不起來(環境問題),先嘗試自行排除(例如缺少套件就安裝),排除不了才問我
- 如果發現某個 task 的範圍實際上需要動到別的 agent/task 的 scope,停下來說明衝突,不要自己擴大範圍硬做

## 4. Commit 規範

- 格式:`feat(FR-XXX): 簡短描述` / `fix(FR-XXX): 簡短描述` / `test(FR-XXX): 簡短描述`
- 每個 commit 只對應一個 task,不要把多個 task 混在一起 commit
- commit message 內文(body)簡述:改了什麼、測試指令、測試結果

## 5. 禁止事項

- 不可以在測試未通過的情況下 commit
- 不可以宣稱「測試通過」卻沒有實際執行測試指令
- 不可以修改 `SPEC.md` 或 `tasks.md` 本身(除非我明確要求)
- 不可以引入 SPEC.md 第 3 節列為 non-negotiable 之外的技術/套件選型(例如換掉指定的 API 或 framework)

## 6. 平行開發規則(多個 Claude Code session 同時工作時適用)

如果 William 指示你在一個新的 git worktree 裡工作,遵守以下規則:

- **一條平行工作線 = 一個 worktree = 一條 branch**。不要每個 task 都開新的 worktree 或新的 branch — 序列相依的 task(例如 T001→T002→T003)應該在同一條 branch 上依序 commit,不要各自獨立開 branch
- 開始工作前,先確認自己被指派的 task 範圍(例如「只做 T001-T003」),不要主動去做被分配給另一條線的 task,即使你覺得自己做得完
- 每個 task 完成 = 一個 commit(見第 4 節 commit 規範),不是一個 branch
- **不要自己執行 merge 回 main/其他 branch 的動作** — 這一步由 William 本人手動處理,即使你覺得沒有衝突也一樣
- 如果發現需要修改的檔案不在自己這條線原本規劃的 scope 內(可能代表跟另一條平行線的工作範圍重疊),停下來回報,不要直接動手改

## 7. 全部 P1 task 完成後

跑完所有 P1 task 後,停下來,整理一份摘要給我:
- 哪些 task 完成、測試結果
- 有沒有任何「測試沒涵蓋、需要人工驗證」的項目(見第 2 節)
- 有沒有卡住、跳過、或標記 NEEDS CLARIFICATION 但還沒解決的項目

不要自動繼續做 P2/P3,等我確認 P1 沒問題後再繼續。
