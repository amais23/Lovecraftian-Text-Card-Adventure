import React, { useState, useEffect, useRef } from 'react';
import { soundEngine } from '../engine/audioManager';

interface TypewriterTextProps {
  text: string;
  speed?: number; // ms per character
  delay?: number; // ms initial delay
  className?: string;
  playSound?: boolean;
  onComplete?: () => void;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 22,
  delay = 0,
  className = '',
  playSound = false,
  onComplete,
}) => {
  const [displayedLength, setDisplayedLength] = useState<number>(0);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [prevText, setPrevText] = useState<string>(text);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (prevText !== text) {
    setPrevText(text);
    setDisplayedLength(0);
    setIsDone(false);
  }

  const clearTimers = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    clearTimers();
    let charIndex = 0;

    const startTyping = () => {
      intervalRef.current = setInterval(() => {
        charIndex += 1;
        setDisplayedLength(charIndex);

        if (playSound && charIndex % 3 === 0) {
          soundEngine.playTypewriterKey();
        }

        if (charIndex >= text.length) {
          if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsDone(true);
          onComplete?.();
        }
      }, speed);
    };

    if (delay > 0) {
      timerRef.current = setTimeout(startTyping, delay);
    } else {
      startTyping();
    }

    return () => {
      clearTimers();
    };
  }, [text, speed, delay, playSound, onComplete]);

  const handleSkip = () => {
    if (!isDone) {
      clearTimers();
      setDisplayedLength(text.length);
      setIsDone(true);
      onComplete?.();
    }
  };

  return (
    <span
      className={`typewriter-text-span ${className} ${isDone ? 'done' : 'typing'}`}
      onClick={handleSkip}
      title={isDone ? undefined : '點擊立即顯示全部文字'}
    >
      {text.slice(0, displayedLength)}
      {!isDone && <span className="typewriter-cursor">▌</span>}
    </span>
  );
};
