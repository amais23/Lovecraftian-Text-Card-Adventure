import React, { useEffect, useRef } from 'react';
import { Scroll, Sparkles } from 'lucide-react';
import { TypewriterText } from './TypewriterText';

interface BattleLogProps {
  logs: string[];
}

export const BattleLog: React.FC<BattleLogProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs]);

  const getLogClass = (log: string, index: number): string => {
    if (index === 0) return 'log-entry latest';
    if (log.includes('勝利')) return 'log-entry victory';
    if (log.includes('殞命') || log.includes('受創') || log.includes('重創')) return 'log-entry combat';
    if (log.includes('造成')) return 'log-entry combat';
    return 'log-entry';
  };

  return (
    <div className="battle-log-card">
      <div className="battle-log-header">
        <h2>
          <Scroll size={18} color="#cfa866" />
          戰鬥日誌 (Battle Log)
        </h2>
        <span className="battle-log-badge">
          <Sparkles size={12} color="#cfa866" />
          即時記錄
        </span>
      </div>

      <div className="battle-log-scroll" ref={scrollRef}>
        {logs.map((log, index) => (
          <div key={`${index}-${log.slice(0, 10)}`} className={getLogClass(log, index)}>
            {index === 0 ? (
              <TypewriterText text={log} speed={14} playSound={false} />
            ) : (
              log
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
