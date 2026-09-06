import React from 'react';
import type { GameAction, GameState } from '../types/game';
import { BookOpen, MapPin, ArrowRight, ShieldAlert, Heart, Coins } from 'lucide-react';
import { AudioToggle } from './AudioToggle';
import { TypewriterText } from './TypewriterText';
import { soundEngine } from '../engine/audioManager';

interface EventScreenProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export const EventScreen: React.FC<EventScreenProps> = ({ state, dispatch }) => {
  const event = state.currentEvent;
  const investigator = state.investigator;

  if (!event) {
    return (
      <div className="event-screen-container">
        <p>事件讀取中……</p>
      </div>
    );
  }

  const isResolved = Boolean(event.selectedOptionId);
  const isGameOver = state.phase === 'gameover' || investigator.health <= 0;

  const handleSelectOption = (optionId: string) => {
    soundEngine.playClick();
    dispatch({
      type: 'RESOLVE_EVENT_OPTION',
      payload: { optionId },
    });
  };

  const handleCompleteEvent = () => {
    soundEngine.playClick();
    dispatch({ type: 'COMPLETE_EVENT' });
  };

  const handleReturnToTitle = () => {
    soundEngine.playClick();
    dispatch({ type: 'RETURN_TO_TITLE' });
  };

  return (
    <div className="event-screen-container">
      <div className="vignette-overlay" />
      <div className="fog-layer" />

      <div className="event-panel-card">
        {/* Event Header */}
        <header className="event-header">
          <div className="event-header-top-row">
            <div className="event-location-tag">
              <MapPin size={16} color="#cfa866" />
              <span>{event.location}</span>
            </div>
            <AudioToggle />
          </div>

          <h1 className="event-title">{event.title}</h1>
          <div className="event-divider-line" />
        </header>

        {/* Narrative Literary Story Text */}
        <div className="event-story-content">
          <div className="event-icon-watermark">
            <BookOpen size={48} color="#cfa866" />
          </div>

          {event.storyText.map((paragraph, idx) => (
            <p key={idx} className="event-story-paragraph">
              <TypewriterText
                text={paragraph}
                speed={16}
                delay={idx * 300}
                playSound={false}
              />
            </p>
          ))}
        </div>

        {/* Status Bar Indicators */}
        <div className="event-status-strip">
          <div className="event-status-item">
            <Heart size={16} color="#ff334b" />
            <span>生命值: {investigator.health} / {investigator.maxHealth}</span>
          </div>
          <div className="event-status-item">
            <Coins size={16} color="#ffd700" />
            <span>古金幣: {investigator.obols} 枚</span>
          </div>
        </div>

        {/* Branching Decisions */}
        {!isResolved ? (
          <div className="event-choices-section">
            <h3 className="event-choices-title">你深吸一口冰冷的空氣，決定如何行動：</h3>
            <div className="event-options-list">
              {event.options.map((option) => {
                const hasEnoughObols = !option.requires?.obols || investigator.obols >= option.requires.obols;
                const isDisabled = !hasEnoughObols;

                return (
                  <button
                    key={option.id}
                    id={`event-option-${option.id}`}
                    className={`event-choice-btn ${isDisabled ? 'disabled' : ''}`}
                    disabled={isDisabled}
                    onClick={() => handleSelectOption(option.id)}
                  >
                    <div className="event-choice-body">
                      <span className="event-choice-text">{option.text}</span>
                      {option.costDescription && (
                        <span className="event-choice-cost">
                          【後果/代價】{option.costDescription}
                        </span>
                      )}
                    </div>
                    <ArrowRight size={18} className="event-choice-arrow" />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Resolved Outcome Box */
          <div className="event-outcome-section">
            <div className={`event-outcome-box ${isGameOver ? 'gameover' : ''}`}>
              <div className="event-outcome-header">
                <ShieldAlert size={20} color={isGameOver ? '#ff334b' : '#ffd700'} />
                <h4>{isGameOver ? '【肉體殞命】致命結局：' : '抉擇後果：'}</h4>
              </div>

              {event.resolvedOutcomeText?.map((outcome, idx) => (
                <p key={idx} className="event-outcome-paragraph">
                  {outcome}
                </p>
              ))}

              {isGameOver && (
                <p className="event-fatal-message">
                  你在探尋秘識的過程中傷重不治，肉體在古老力量的噬咬下化作枯骨。調查就此終結……
                </p>
              )}
            </div>

            {isGameOver ? (
              <button
                id="event-gameover-btn"
                className="event-continue-btn death"
                onClick={handleReturnToTitle}
              >
                <span>肉體殞命，返回標題畫面</span>
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                id="event-continue-btn"
                className="event-continue-btn"
                onClick={handleCompleteEvent}
              >
                <span>整理行囊，返回調查地圖</span>
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
