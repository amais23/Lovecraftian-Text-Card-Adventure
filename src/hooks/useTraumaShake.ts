import { useState, useEffect, useRef } from 'react';

export interface TraumaShakeResult {
  isShaking: boolean;
  shakeKey: number;
}

/**
 * 自訂 Hook：監聽數值指標下降（例如受到肉體傷害或理智侵蝕），
 * 自動觸發受創震動狀態，並於每次連擊時更新 shakeKey 以重置 CSS 動畫。
 *
 * @param metric 監聽的數值指標（如 health 或 sanityCount）
 * @param duration 震動動效持續毫秒數（預設 450ms）
 */
export function useTraumaShake(metric: number, duration = 450): TraumaShakeResult {
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [shakeKey, setShakeKey] = useState<number>(0);
  const prevMetricRef = useRef<number>(metric);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (metric < prevMetricRef.current) {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setShakeKey((prev) => prev + 1);
      setIsShaking(true);

      timerRef.current = setTimeout(() => {
        setIsShaking(false);
        timerRef.current = null;
      }, duration);
    }
    prevMetricRef.current = metric;

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [metric, duration]);

  return { isShaking, shakeKey };
}
