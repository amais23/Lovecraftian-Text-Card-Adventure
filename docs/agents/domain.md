# 領域文件規範 (Domain Docs)

規範各項 Engineering Skills 在探索本程式碼庫時，應如何讀取與遵循專案的領域知識文件。

## 在探索程式碼之前，請先閱讀以下內容

- 儲存庫根目錄下的 **`CONTEXT.md`**，或
- 根目錄下的 **`CONTEXT-MAP.md`**（若存在）—— 它會指向每個子領域對應的 `CONTEXT.md`，請閱讀與當前任務相關的內容。
- **`docs/adr/`** —— 閱讀與即將進行之工作範圍相關的架構決策記錄（ADR）。在多情境（Multi-context）儲存庫中，亦應檢查 `src/<context>/docs/adr/` 內的領域特定決策。

若上述任何檔案尚不存在，**請靜默繼續進行**。不需要主動提及它們缺失，也不要在初期建議使用者建立。`/domain-modeling` 技能（透過 `/grill-with-docs` 或 `/improve-codebase-architecture` 調用）會在術語或架構決策實際達成共識時，延遲建立它們。

## 檔案目錄結構

單一領域儲存庫（Single-context，適用絕大多數專案）：

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

多領域儲存庫（Multi-context，根目錄存在 `CONTEXT-MAP.md`）：

```
/
├── CONTEXT-MAP.md
├── docs/adr/                          ← 系統全域決策
└── src/
    ├── ordering/
    │   ├── CONTEXT.md
    │   └── docs/adr/                  ← 領域專屬決策
    └── billing/
        ├── CONTEXT.md
        └── docs/adr/
```

## 使用術語表定義的專用詞彙

當輸出的內容涉及領域概念時（無論在任務標題、重構提案、假說驗證或測試名稱中），請嚴格使用 `CONTEXT.md` 中定義的術語，切勿使用術語表中已明確避免的近義詞。

如果需要的概念尚未收錄在術語表中，這是一個訊號 —— 代表可能使用了本專案未採用的語言（需重新考慮），或是存在真正的領域缺口（請記錄下來供 `/domain-modeling` 補充）。

## 明確標記與 ADR 衝突之處

如果提出的方案與既有的架構決策（ADR）有所衝突，必須明確提出，而非靜默覆寫：

> _與 ADR-0007 (event-sourced orders) 衝突 —— 但值得重新討論，因為…_
