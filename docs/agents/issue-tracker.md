# Issue Tracker: GitHub

本專案的工作任務（Issues）與規格需求（PRDs）統一記錄於 GitHub Issues。所有操作均透過 `gh` 命令列工具（CLI）執行。

## 操作慣例與指令

- **建立任務 (Issue)**: `gh issue create --title "..." --body "..."`。多行內文可使用 heredoc 語法。
- **讀取任務**: `gh issue view <編號> --comments`，透過 `jq` 過濾留言並獲取標籤資訊。
- **列出任務清單**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`，並搭配相應的 `--label` 與 `--state` 篩選條件。
- **在任務中留言**: `gh issue comment <編號> --body "..."`
- **新增 / 移除標籤**: `gh issue edit <編號> --add-label "..."` / `--remove-label "..."`
- **關閉任務**: `gh issue close <編號> --comment "..."`

若在 Git clone 目錄下執行，`gh` 會依據 `git remote -v` 自動推斷所屬儲存庫。

## Pull Requests 作為分流處理界面

**PRs as a request surface: no.** _（若此儲存庫將外部 PR 視為功能需求請求，請設為 `yes`；`/triage` 技能會讀取此旗標。）_

當設定為 `yes` 時，PR 將採用與 Issue 相同的標籤與狀態流轉，使用對應的 `gh pr` 指令：

- **讀取 PR**: `gh pr view <編號> --comments` 以及 `gh pr diff <編號>` 檢視差異。
- **列出待分流的外部 PR**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments`，並僅保留 `authorAssociation` 為 `CONTRIBUTOR`、`FIRST_TIME_CONTRIBUTOR` 或 `NONE`（排除 `OWNER`/`MEMBER`/`COLLABORATOR`）。
- **留言 / 標籤 / 關閉**: 使用 `gh pr comment`、`gh pr edit --add-label`/`--remove-label`、`gh pr close`。

GitHub 的 Issue 與 PR 共用同一個編號空間，若為單純數字 `#42`，可先嘗試 `gh pr view 42`，失敗再退回執行 `gh issue view 42`。

## 當技能要求「發布至 Issue Tracker」時

建立一則 GitHub Issue。

## 當技能要求「獲取相關工作票（Fetch ticket）」時

執行 `gh issue view <編號> --comments`。

## 尋路操作（Wayfinding Operations）

供 `/wayfinder` 技能使用。**地圖 (Map)** 是一則包含所有**子任務 (Child issues)** 的單一主 Issue。

- **地圖 (Map)**: 標記為 `wayfinder:map` 的單一 Issue，內含 Notes / Decisions-so-far / Fog 等區塊。建立指令：`gh issue create --label wayfinder:map`。
- **子任務工作票 (Child ticket)**: 作為 GitHub sub-issue 關聯至地圖（透過 `gh api` 呼叫 sub-issues 端點）。若未啟用 sub-issues 功能，則將子任務列入地圖 Issue 內文的 task list 中，並在子任務內文頂端加上 `Part of #<map>`。標籤格式：`wayfinder:<類型>`（`research`/`prototype`/`grilling`/`task`）。認領後分配給主要執行的開發者。
- **阻擋關係 (Blocking)**: 使用 GitHub **原生任務依賴關係 (Native issue dependencies)**。使用指令新增關聯：`gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`，其中 `<blocker-db-id>` 是阻擋者的**資料庫數字 ID**（透過 `gh api repos/<owner>/<repo>/issues/<n> --jq .id` 取得，**而非** Issue 編號或 node_id）。GitHub 會在 `issue_dependencies_summary.blocked_by` 回報未解決的阻擋項。若依賴功能不可用，則在子任務頂端退回使用 `Blocked by: #<n>, #<n>`。當所有前置任務均關閉時視為解除阻擋。
- **前沿查詢 (Frontier query)**: 列出地圖中所有開啟狀態的子任務（`gh issue list --state open`，範圍限定在地圖的 sub-issues / task list），排除任何具有未解決阻擋者（`issue_dependencies_summary.blocked_by > 0` 或在 `Blocked by` 行中有未關閉 Issue）或已有指派者的任務；依照地圖順序取第一筆處理。
- **認領任務 (Claim)**: `gh issue edit <n> --add-assignee @me`（此為工作階段的首次寫入）。
- **解決任務 (Resolve)**: `gh issue comment <n> --body "<答案>"`，接著執行 `gh issue close <n>`，然後將情境指標（摘要 + 連結）附加至 `map.md` 的 Decisions-so-far 區塊。
