# 混成自動更新架構（Hybrid Auto-Update Architecture）

## 決策背景與核心決策

為提供調查員最新版本體驗，遊戲需支援跨平台（Windows, macOS, Linux/Steam Deck）的無縫自動更新。我們決定在主選單（Title Screen）採用非侵入式彈窗提醒與手動檢查雙軌制，底層採用「混成更新架構」：標準安裝版（Windows NSIS, macOS .app, Linux AppImage）採用 Tauri 官方 `plugin-updater` 搭配 GitHub Releases 靜態 `latest.json`；Windows 免安裝綠色版（Portable ZIP）則採用 Rust `self_replace` 進行二進位檔案原地無感置換，使所有平台玩家均能享受一鍵下載重啟、零手動介入的更新體驗。此外，為保障存檔與執行期狀態安全，探險與戰鬥進行中一律鎖定更新。

## 考慮過的方案 (Considered Options)

1. **純手動導引至 GitHub Releases 頁面**：
   - *捨棄原因*：要求玩家自行下載 zip 覆蓋或重新執行 setup，體驗割裂且流失率高。
2. **全平台純走 Tauri 官方更新插件（NSIS 升級）**：
   - *捨棄原因*：Windows 免安裝版（Portable）玩家點擊更新後會被靜默安裝至系統 `AppData` 目錄，原本解壓縮路徑的執行檔仍停留在舊版，導致「更新無效/找不到檔案」的認知混亂。
3. **全平台採用 `self_update` CLI 庫**：
   - *捨棄原因*：引入過多重型依賴（reqwest, tls, tar, zip），難以將下載進度平滑傳遞給 React 前端進度條，且容易觸發 GitHub API 速率限制。
4. **混成架構（Tauri Updater + `self_replace` 原地置換，本決策採納）**：
   - *採納原因*：兼具 Tauri 原生官方簽名保護與 Windows 免安裝版原位升級能力，前端維持單一統一的克蘇魯風格彈窗與下載進度條。

## 架構影響與推論 (Consequences)

1. **CI/CD 管線變更**：
   - 需要在 GitHub Actions（`desktop-release.yml`）中配置 Minisign 私鑰與密碼（`TAURI_SIGNING_PRIVATE_KEY`），並在 `tauri.conf.json` 中配置公鑰與端點。
   - Release 需持續產出 `latest.json` 與各平台安裝包及獨立 `LovecraftianCardAdventure.exe`。
2. **存檔安全性**：
   - 更新重啟僅在主選單觸發，戰鬥與探索流程中鎖定，徹底避免記憶體狀態跨版本還原導致壞檔。
3. **前端狀態與免打擾**：
   - 支援「不再提示此版本」本地標記（記錄忽略之版本號），並在設定選單（SettingsModal）中保留隨時手動檢查更新與重設忽略的入口。
