import React, { useEffect } from 'react';

export const AbyssDeathScreen: React.FC = () => {
  // Prevent any keyboard navigation or shortcuts from bypassing the lockout
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('contextmenu', handleContextMenu, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
    };
  }, []);

  return (
    <main
      className="abyss-you-died-screen"
      data-testid="abyss-you-died-screen"
      role="alert"
      aria-live="assertive"
    >
      <div className="abyss-you-died-vignette" />

      {/* Soulslike Classical Hero Typography */}
      <h1 className="abyss-you-died-title">YOU DIED</h1>

      <div className="abyss-you-died-line" />

      {/* Atmospheric Eldritch whispers */}
      <p className="abyss-you-died-subtext">
        意識已完全沉入無底深淵 · 萬物終歸死寂
      </p>
    </main>
  );
};
