import React, { useState, useEffect } from 'react';
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

  if (prevText !== text) {
    setPrevText(text);
    setDisplayedLength(0);
    setIsDone(false);
  }

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let charIndex = 0;

    const startTyping = () => {
      const interval = setInterval(() => {
        charIndex += 1;
        setDisplayedLength(charIndex);

        if (playSound && charIndex % 3 === 0) {
          soundEngine.playTypewriterKey();
        }

        if (charIndex >= text.length) {
          clearInterval(interval);
          setIsDone(true);
          onComplete?.();
        }
      }, speed);

      return () => clearInterval(interval);
    };

    if (delay > 0) {
      timer = setTimeout(startTyping, delay);
    } else {
      const cleanup = startTyping();
      return () => {
        cleanup();
        if (timer) clearTimeout(timer);
      };
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [text, speed, delay, playSound, onComplete]);

  const handleSkip = () => {
    if (!isDone) {
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
      style={{ cursor: isDone ? 'inherit' : 'pointer' }}
    >
      {text.slice(0, displayedLength)}
      {!isDone && <span className="typewriter-cursor">▌</span>}
    </span>
  );
};
