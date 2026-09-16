/**
 * Fisher-Yates 洗牌演算法（均勻無偏隨機）
 * 支援注入自訂 randomFn，確保測試與模擬的純度與可重現性
 */
export function fisherYatesShuffle<T>(items: readonly T[], randomFn: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
