# 規格需求說明書 (PRD Spec): 混成自動更新體系、跨平台無縫升級與版本安全防護

**狀態 (Triage Label)**: `ready-for-agent`  
**目標版本**: `v0.4.1`  
**領域情境 (Context)**: [CONTEXT.md](file:///Users/sandbox1/Documents/文字冒險遊戲/CONTEXT.md)  
**追蹤 Issue**: [#72](https://github.com/amais23/Lovecraftian-Text-Card-Adventure/issues/72)  

**關聯子任務**:

- [#73](https://github.com/amais23/Lovecraftian-Text-Card-Adventure/issues/73) Task: 更新服務適配層與主選單非侵入提醒彈窗
- [#74](https://github.com/amais23/Lovecraftian-Text-Card-Adventure/issues/74) Task: 系統設定手動檢查入口與進行中對弈安全鎖定
- [#75](https://github.com/amais23/Lovecraftian-Text-Card-Adventure/issues/75) Task: Tauri 官方更新外掛整合、下載進度條與自動重啟
- [#76](https://github.com/amais23/Lovecraftian-Text-Card-Adventure/issues/76) Task: Windows 免安裝版原地置換指令
- [#77](https://github.com/amais23/Lovecraftian-Text-Card-Adventure/issues/77) Task: 版本號升級至 v0.4.1、CI 自動簽名與舊版本手動升級發布說明

**架構決策參考**:

- [ADR-0040](file:///Users/sandbox1/Documents/文字冒險遊戲/docs/adr/0040-hybrid-auto-update-architecture.md)（混成自動更新架構）

---

## Problem Statement

調查員在下載並遊玩遊戲後，當有新的卡牌平衡修訂、不可名狀之事件、敵怪 AI 行為修正或系統錯誤補丁發布時，目前遊戲缺乏任何遊戲內提示或自動升級機制。玩家必須自行關注 GitHub Releases 頁面，手動下載 ZIP 或安裝檔重新覆蓋，流程繁瑣且極易遺漏最新版本。此外，若在戰鬥對弈或節點探險途中突發更新重啟，會造成記憶體內之即時對局狀態損毀或壞檔。在 Windows 平台上，免安裝綠色版（Portable ZIP）若直接套用標準安裝器更新，會將檔案安裝到系統目錄而脫離原本的綠色解壓路徑，造成「更新後原檔案依然是舊版」的混淆現象。

---

## Solution

依據 ADR-0040 確立之混成自動更新體系：

1. **主選單非侵入式更新提醒**：遊戲啟動進入主標題畫面（Title Screen）時，在背景非阻塞檢查 GitHub Releases 靜態 `latest.json`。若有新版本，主動跳出風格化更新通知彈窗，提供版本號、更新日誌與「不再提示此版本」選項。
2. **混成更新底層引擎**：
   - 標準安裝版（Windows NSIS, macOS .app, Linux AppImage）：整合 Tauri v2 官方更新外掛（`@tauri-apps/plugin-updater`），支援 Minisign 數位簽名校驗與原生進度事件。
   - Windows 免安裝綠色版（Portable ZIP）：透過 Rust 輕量 Crate `self_replace` 實作單檔執行檔的原地二進位置換，達成同目錄無感升級重啟。
3. **進行中對弈安全防護**：嚴格限制僅在主選單（Title Screen）允許執行更新重啟；在探索與戰鬥等對弈進程中，設定選單內的更新功能予以鎖定並導引返回主選單，徹底保障存檔完整性。
4. **手動檢查入口**：於「遊戲設定（SettingsModal）」新增版本資訊與手動檢查更新按鈕，若有新版即可隨時喚起更新彈窗，並在連線異常時提供明確反饋。

---

## User Stories

1. 身為調查員，當我在主選單開啟遊戲時，系統應在背景默默檢查是否有新版本發布，在不阻塞主介面操作的前提下獲取更新資訊。
2. 身為調查員，當有新版本可用時，我希望在主選單看到風格化的更新通知彈窗，顯示新版版本號與更新日誌，以便了解新內容。
3. 身為調查員，如果我暫時不想更新當前版本，我可以在彈窗中勾選「不再提示此版本」並關閉，使遊戲在該版本期間不再於啟動時跳出彈窗打擾。
4. 身為調查員，當新版本之後又有「更高版本（如 v0.6.0）」發布時，先前針對 v0.5.0 的忽略設定應自動失效，再次提醒我進行更新。
5. 身為調查員，若我曾勾選不再提示，但我改變心意想更新時，我可以開啟「遊戲設定」點擊「檢查更新」手動喚起更新彈窗。
6. 身為調查員，在離線或網路不通的環境下啟動遊戲時，背景檢查更新應靜默超時略過，絕不彈出錯誤阻礙我進入單機遊玩。
7. 身為調查員，若我在「遊戲設定」中主動點擊「檢查更新」但連線失敗，我希望看到明確的「無法連線至更新伺服器」提示，以便排查網路狀況。
8. 身為調查員，當我點擊「立即更新」時，彈窗應顯示即時下載進度條（0% 至 100%），讓我清楚知曉下載狀態。
9. 身為調查員，當下載完成後，彈窗按鈕應轉為「更新完畢，立即重啟」，點擊後遊戲自動平滑重啟並進入新版本。
10. 身為使用 Windows 免安裝綠色版的調查員，當我點擊更新時，系統應直接原地替換原本資料夾的執行檔，不把遊戲安裝到 C 槽系統目錄中，保持隨身綠色特性。
11. 身為在 macOS 上遊玩的調查員，我希望更新能夠自動替換應用程式目錄中的 `.app` 套件，不需要手動重新拖拉 DMG。
12. 身為在 Steam Deck（SteamOS）遊玩的調查員，我希望 AppImage 能在原地升級完成，維持非 Steam 遊戲捷徑的可用性。
13. 身為正在深淵探索或對弈戰鬥中的調查員，若我在此期間開啟設定選單，更新按鈕應提示「請返回主標題選單進行更新」並鎖定更新，避免我的戰鬥狀態或未結算存檔受損。

---

## Implementation Decisions

- **架構模式**：
  - 遵循 ADR-0040 所定義的混成更新架構。
  - 前端與後端切分單一邊界 `UpdateService` 適配器。
- **前端模組與介面**：
  - `UpdateModal`：展示版本、Release Body 更新日誌、下載進度條、不再提示 Checkbox、立即更新與稍後再說按鈕。
  - `SettingsModal`：新增「版本與更新」欄位，顯示當前 App 版本、最新狀態與「檢查更新」按鈕。
  - `TitleScreen`：掛載自動更新生命週期 Hook，進入主選單時執行一次非阻塞檢查。
  - `useAutoUpdater`：封裝狀態機（`idle` | `checking` | `available` | `downloading` | `ready` | `error`）、進度回報與 localStorage 儲存忽略版本號（`arkham_ignored_update_version`）。
- **後端與 CI/CD 模組**：
  - 配置 `tauri-plugin-updater` 與前端 `@tauri-apps/plugin-updater`。
  - 在 Rust 端引入 `self_replace`，實作單檔執行檔的原地置換 command `self_replace_binary`，用於 Windows Portable 模式。
  - 於 `.github/workflows/desktop-release.yml` 接入 `TAURI_SIGNING_PRIVATE_KEY` 數位簽名，產生 `latest.json` 與各平台更新簽名包。
- **降級與防禦設計**：
  - 在非 Tauri 環境（如純瀏覽器開發模式 `npm run dev` 或 Vitest 測試）中，自動啟用 Mock/No-op 適配器，防止拋出執行期異常。

---

## Testing Decisions

- **測試原則**：僅測試外部可觀測行為與玩家操作狀態流轉，不綁定底層 Tauri 實作細節。
- **受測模組**：
  - `UpdateService` / `useAutoUpdater`：測試版本比對邏輯、忽略清單儲存與排除、靜默模式與手動模式的錯誤抑制差異。
  - `UpdateModal` 與 `SettingsModal` 元件整合測試：測試彈窗渲染、點擊進度條狀態轉換、勾選「不再提示」後的儲存行為。
- **參考先例**：參考專案中現有的 `SettingsModal.test.tsx` 與 `devModeManager.test.ts` 的測試模式。

---

## Out of Scope

- 差分二進位更新（Binary Delta Patching）。
- 多版本分支選擇（如測試通道/Beta Channel）。
- 遊戲進行中的記憶體即時熱重載（Hot-Reload）。

---

## Further Notes

- 簽名金鑰保管：Minisign 金鑰對需於 GitHub Secrets 妥善保存，公鑰填入 `src-tauri/tauri.conf.json`。
