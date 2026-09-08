# 0028. 心智響應特色自訂游標、深度混成架構與統一圖集切圖管線 (Sanity-Responsive Custom Cursor, Deep Hybrid Architecture & Unified Sprite Atlas)

## 狀態 (Status)

Accepted（補充 ADR-0006、ADR-0013、ADR-0020 與 ADR-0021）

## 脈絡與決策動機 (Context & Trade-offs)

遊戲目前全面使用作業系統之原生游標（標準箭頭、pointer 手勢、grab 抓取等），缺乏 1920 年代復古懸疑與克蘇魯神話之沉浸手感。為了強化整體介面的代入感，並將「理智崩潰」的核心主題延伸至玩家最直接的互動媒介——游標，我們規劃打造專屬特色自訂游標。

在設計此機制時，面臨以下關鍵架構與工程權衡：

1. **游標渲染架構：原生 CSS 游標 vs 純虛擬 DOM 追隨游標 vs 深度混成架構**：
   - *純原生 CSS*（`cursor: url(...)`）：擁有 0 延遲硬體級精準度與極致效能，但無法呈現動態粒子與懸停自轉。
   - *純虛擬 DOM/Canvas*（`pointer-events: none` 追隨）：視覺表現極高，但因依賴 JS 主線程事件，在 60Hz 螢幕可能產生 1~2 幀微小遲滯感（Cursor Lag），破壞卡牌操作的俐落手感。
   - *深度混成架構（Deep Hybrid Architecture - 獲選）*：將功能性點擊鎖定在原生 CSS 硬體層（保證 0ms 延遲），頂層以零侵入、非阻塞之裝飾層呈現金色秘識星芒或深淵紫霧微粒子，兼顧極致操作手感與豐富氛圍。
2. **AI 生成圖一致性：單張分散生圖 vs 單張統一精靈圖集（Sprite Sheet Atlas）**：
   - 分開多次生圖容易產生光影角度、色彩飽和度與透視比例不一致的割裂感。
   - 採單張 1:1（1024x1024）圖集，在一份提示詞中同時產出 8 格（4 常態 + 4 瘋狂態）結構化矩陣，再由自動化腳本切片去背，確保美術風格、材質紋理百分之百統一。
3. **心智狀態連動：單一風格 vs 雙態異化**：
   - 延續 ADR-0021 認知濾鏡機制，常態下維持「1920 年代復古調查員（雕花黃銅/黑皮革）」樣貌，理智歸零（`isMadness === true`）時異化為「深淵蠕動觸鬚與古神骨針」，達成感官層面的同步狂亂。

---

## 決策內容 (Decision)

### 1. 雙態心智游標體系 (Dual-State Cursor System)

游標狀態全面呼應調查員的心智狀態（`isMadness`）：
- **常態探索（Normal State）**：典雅黃銅金（`--border-gold-bright`）與黑皮革質感。
  - `default`：1920s 雕花黃銅羅盤指針（探索與常態移動）。
  - `pointer`：伸出之黑皮革手套指尖或羽毛筆尖，微泛金光（按鈕、可點擊節點、可打出手牌）。
  - `grab` / `grabbing`：皮革手套半握/緊抓姿態（戰鬥手牌拖曳出牌）。
  - `not-allowed`：封閉黃銅鎖具或禁錮印記（費用不足或不可交互）。
- **瘋狂異化（Madness State）**：幽光深淵紫（`--color-sanity`）與暗影骨針。
  - `default`：扭曲的古神黑曜石骨針，周圍纏繞細微觸鬚。
  - `pointer`：延伸刺探的異界觸鬚尖端，泛起暗紫光暈。
  - `grab` / `grabbing`：深淵觸鬚盤旋抓攫姿態。
  - `not-allowed`：血色舊神咒印封印。

### 2. 統一精靈圖集與切片規格 (Unified Sprite Atlas & Dual-Spec Resolution)

- **AI 圖集生成規格**：單張 1024x1024 影像，內含 4 欄 × 2 列（共 8 格）之等距游標設計，在純色高對比背景下生成。
- **自動化切圖與去背**：透過專屬切圖工具（`scratch/slice_cursors.py`），進行色度去背、邊緣抗鋸齒處理與居中裁剪。
- **高清雙軌輸出**：
  - 標準規格：`32x32` 像素 PNG，存放在 `public/cursors/`，確保所有瀏覽器引擎最佳相容性。
  - Retina @2x 規格：`64x64` 像素 PNG，存放在 `public/cursors/@2x/`，供高 DPI 顯示器精緻呈現。
- **熱點座標（Hotspots）標準**：
  - `default` / `pointer`：熱點錨定於左上方尖端 `(4, 4)`（64px 則為 `(8, 8)`）。
  - `grab` / `grabbing`：熱點錨定於中心抓握點 `(16, 16)`（64px 則為 `(32, 32)`）。
  - `not-allowed`：熱點錨定於圖形中心或左上。

### 3. 深度混成架構（Deep Hybrid Architecture）

- **CSS 接縫（CSS Seam）**：
  - 在 `src/styles/cursor.css` 透過 CSS 變數定義全域游標：
    ```css
    :root[data-sanity-state="normal"] {
      --cursor-default: url('/cursors/default.png') 4 4, default;
      --cursor-pointer: url('/cursors/pointer.png') 4 4, pointer;
      --cursor-grab: url('/cursors/grab.png') 16 16, grab;
      --cursor-grabbing: url('/cursors/grabbing.png') 16 16, grabbing;
      --cursor-not-allowed: url('/cursors/disabled.png') 4 4, not-allowed;
    }
    :root[data-sanity-state="madness"] {
      --cursor-default: url('/cursors/madness-default.png') 4 4, default;
      --cursor-pointer: url('/cursors/madness-pointer.png') 4 4, pointer;
      --cursor-grab: url('/cursors/madness-grab.png') 16 16, grab;
      --cursor-grabbing: url('/cursors/madness-grabbing.png') 16 16, grabbing;
      --cursor-not-allowed: url('/cursors/madness-disabled.png') 4 4, not-allowed;
    }
    ```
  - 原有 UI 元件（按鈕、卡牌、大地圖節點）**完全不需修改既有 class 或 inline-style**，維持純淨低耦合。
- **狀態同步 Seam**：
  - 於 `App.tsx` 或根節點監聽 `state.isMadness`，同步更新 `document.documentElement.dataset.sanityState`。
- **裝飾氛圍層（Cursor Atmosphere FX）**：
  - 獨立元件 `CustomCursorAtmosphere.tsx`，設置 `pointer-events: none` 與 `position: fixed`。
  - 滑鼠移動與點擊時，在游標位置釋放輕量微粒子（常態為金色秘識微塵，瘋狂態為紫暗深淵迷霧），若瀏覽器效能受限或執行單元測試時自動靜默，不阻塞任何主線程交互。
- **全域不可關閉核心沉浸原則**：
  - 特色游標作為遊戲核心克蘇魯沉浸美學之不可分割環節，預設並持續全域啟用。

---

## 影響 (Consequences)

- 玩家從滑鼠移入遊戲畫面的瞬間即沉浸於 1920 年代阿卡姆調查氛圍中，進入瘋狂狀態時游標突變更深化精神失常之衝擊力。
- 採用 CSS 原生硬體加速搭配解耦微粒子層，達到 0ms 操作延遲與極致流暢度，杜絕傳統虛擬游標的遲滯感。
- 切圖管線程式化，未來若擴充特殊職業專屬游標（如秘術學者的儀式匕首、私家偵探的左輪手槍準星）具備高度模組化複用性。
