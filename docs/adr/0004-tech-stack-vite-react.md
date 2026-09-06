# 0004. 採用 Vite + React + TypeScript + Vanilla CSS + Framer Motion

為兼顧文字冒險的精緻版面呈現（如打字機漸顯、古卷深色模式）與卡牌策略的流暢物理手感（扇形展開、懸浮放大、拖曳出牌），我們決定採用 **Vite + React + TypeScript** 作為前端主體，並以 **Vanilla CSS** 配合 **Framer Motion** 作為動態與視覺設計體系。

此選型避免了重度遊戲引擎龐大的打包體積與 WASM 載入延遲，同時具備高度跨平台與免伺服器靜態部署的能力；搭配 `react-icons/gi` 能夠直接零成本引入上千款克蘇魯神話與奇幻風格的向量卡牌圖示。
