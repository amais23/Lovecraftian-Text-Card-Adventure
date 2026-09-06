import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from '../engine/audioManager';

export const AudioToggle: React.FC = () => {
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEngine.getMuted());

  const handleToggle = () => {
    const nextMuted = soundEngine.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      soundEngine.playClick();
    }
  };

  return (
    <button
      id="audio-toggle-btn"
      className="audio-toggle-btn"
      onClick={handleToggle}
      title={isMuted ? '開啟音效 (Sound On)' : '靜音 (Mute)'}
      aria-label={isMuted ? '開啟音效' : '靜音'}
    >
      {isMuted ? <VolumeX size={18} color="#9d9685" /> : <Volume2 size={18} color="#cfa866" />}
    </button>
  );
};
