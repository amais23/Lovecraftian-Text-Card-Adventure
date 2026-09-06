/**
 * 扇形手牌幾何數學計算模組 (Hand Fan-out Geometry)
 * 模擬真實實體卡牌握於手中的圓弧展開曲線、水平分佈與層級排序
 */

export interface HandFanOutTransform {
  rotate: number; // 旋轉角度 (degrees)
  x: number;      // 水平位移 (px)
  y: number;      // 縱向弧度位移 (px)
  zIndex: number; // 渲染深度
}

/**
 * 計算特定手牌索引在總手牌數量下的扇形幾何轉換數值
 * @param index 當前卡牌在手牌中的索引 (0-based)
 * @param total 手牌總張數
 */
export function calculateCardFanOut(index: number, total: number): HandFanOutTransform {
  if (total <= 0) {
    return { rotate: 0, x: 0, y: 0, zIndex: 1 };
  }

  if (total === 1) {
    return { rotate: 0, x: 0, y: 0, zIndex: 10 };
  }

  // 計算相對於中央卡牌的對稱偏移值 (例如 4 張牌為 -1.5, -0.5, 0.5, 1.5)
  const offset = index - (total - 1) / 2;

  // 根據手牌數量動態收斂旋轉角度（牌越多角度越平緩，避免極端翻轉）
  const maxAngle = Math.min(26, total * 6);
  const angleStep = maxAngle / (total - 1);
  const rotate = Math.round(offset * angleStep * 10) / 10;

  // 水平間距 (卡牌多時自動重疊收緊，使用對稱捨入確保左右絕對對稱)
  const spacing = Math.min(115, Math.max(55, 680 / total));
  const x = Math.sign(offset) * Math.round(Math.abs(offset) * spacing);

  // 拋物線下凹弧度：中央高、兩翼自然下垂
  const arcFactor = Math.min(4.8, 30 / total);
  const y = Math.round(Math.pow(Math.abs(offset), 1.75) * arcFactor);

  return {
    rotate,
    x,
    y,
    zIndex: 10 + index,
  };
}
