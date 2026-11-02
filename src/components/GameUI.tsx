import React from 'react';
import type { GameState } from '../core/types';

interface GameUIProps {
  state: GameState;
  highScore: number;
}

export const GameUI = React.memo(function GameUI({ state, highScore }: GameUIProps) {
  if (state.status !== 'gameover') return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)',
        color: '#00e5ff',
        fontFamily: 'monospace',
        userSelect: 'none',
        gap: '12px',
      }}
    >
      <div style={{ fontSize: '42px', fontWeight: 'bold', color: '#ff4466', letterSpacing: '4px' }}>
        GAME OVER
      </div>

      <div style={{ fontSize: '20px', marginTop: '8px' }}>
        Score: <span style={{ color: '#ffffff' }}>{state.score}</span>
      </div>

      {state.score >= highScore && state.score > 0 && (
        <div style={{ fontSize: '18px', color: '#ffcc00' }}>NEW HIGH SCORE!</div>
      )}

      <div style={{ fontSize: '16px', color: '#aaaacc' }}>
        Best: {highScore}
      </div>

      <div
        style={{
          marginTop: '20px',
          fontSize: '18px',
          color: '#88ffcc',
          animation: 'pulse 1.2s ease-in-out infinite',
        }}
      >
        Press <kbd style={{ background: '#113344', padding: '2px 8px', borderRadius: '4px' }}>R</kbd>{' '}
        or{' '}
        <kbd style={{ background: '#113344', padding: '2px 8px', borderRadius: '4px' }}>Enter</kbd>{' '}
        to restart
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
});
