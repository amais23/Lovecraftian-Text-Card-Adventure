import { useState, useEffect, useRef } from 'react';

export interface SanityFlickerResult {
  isFlickering: boolean;
  flickerKey: number;
}

/**
 * 自訂 Hook：監聽理智牌庫張數（Sanity Deck Count）扣減或侵蝕，
 * 自動觸發短暫的認知濾鏡驚悚閃爍狀態（Sanity Flicker），約 850ms (ADR-0021)。
 *
 * @param sanityCount 當前理智牌庫張數
 * @param duration 閃爍持續毫秒數（預設 850ms）
 */
export function useSanityFlicker(sanityCount: number, duration = 850): SanityFlickerResult {
  const [isFlickering, setIsFlickering] = useState<boolean>(false);
  const [flickerKey, setFlickerKey] = useState<number>(0);
  const prevCountRef = useRef<number>(sanityCount);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 當理智牌庫張數減少時（例如施展魔法棄牌、受到敵人侵蝕）觸發閃爍
    if (sanityCount < prevCountRef.current) {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setFlickerKey((prev) => prev + 1);
      setIsFlickering(true);

      timerRef.current = setTimeout(() => {
        setIsFlickering(false);
        timerRef.current = null;
      }, duration);
    }
    prevCountRef.current = sanityCount;

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [sanityCount, duration]);

  return { isFlickering, flickerKey };
}
