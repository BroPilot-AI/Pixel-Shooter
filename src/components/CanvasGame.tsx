import { useEffect, useRef, useState } from 'react';
import { initGameState, tick, CANVAS_W, CANVAS_H } from '../core/GameEngine';
import { render } from '../core/Renderer';
import { useKeySet } from '../core/Input';
import { useLocalStorage } from '../utils/useLocalStorage';
import { GameUI } from './GameUI';
import type { GameState } from '../core/types';

export function CanvasGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>(initGameState());
  const frameRef = useRef(0);
  const keysRef = useKeySet();

  // React state for overlay — only updated on status/score changes
  const [overlayState, setOverlayState] = useState<GameState>(gameStateRef.current);
  const [highScore, setHighScore] = useLocalStorage('pixelShooterHighScore', 0);
  const highScoreRef = useRef(highScore);
  highScoreRef.current = highScore;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    let prevStatus = gameStateRef.current.status;

    const loop = () => {
      const keys = keysRef.current ?? new Set<string>();
      gameStateRef.current = tick(keys, gameStateRef.current);
      frameRef.current++;

      render(ctx, gameStateRef.current, frameRef.current);

      const { status, score } = gameStateRef.current;

      // Persist high score when game ends
      if (status === 'gameover' && prevStatus !== 'gameover') {
        if (score > highScoreRef.current) {
          setHighScore(score);
        }
        setOverlayState({ ...gameStateRef.current });
      }

      // Sync overlay state on restart
      if (status === 'playing' && prevStatus === 'gameover') {
        setOverlayState({ ...gameStateRef.current });
      }

      prevStatus = status;
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: `${CANVAS_W}px`,
        height: `${CANVAS_H}px`,
        border: '2px solid #1a1a4a',
        boxShadow: '0 0 40px rgba(0,100,255,0.15)',
      }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ display: 'block' }}
      />
      <GameUI state={overlayState} highScore={highScore} />
    </div>
  );
}
