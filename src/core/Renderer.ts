import type { GameState, Player, Enemy, Bullet } from './types';
import { CANVAS_W, CANVAS_H, STARS } from './GameEngine';

// ─── Color palette ────────────────────────────────────────────────────────────
const C = {
  bg: '#050510',
  playerBody: '#00e5ff',
  playerCockpit: '#0077cc',
  playerFlame: '#ff6600',
  playerFlameInner: '#ffcc00',
  playerInvincible: '#88aaff',
  bulletPlayer: '#00ff88',
  bulletEnemy: '#ff4400',
  enemyRow0: '#ff6600',   // orange — top row (20 pts)
  enemyRow1: '#dd2233',   // red
  enemyRow2: '#cc1155',   // magenta-red
  enemyRow3: '#bb0066',
  enemyRow4: '#aa0077',
  enemyEye: '#ffff00',
  hudText: '#00e5ff',
  hudLife: '#ff4466',
  hudLifeEmpty: '#331122',
  scoreFlash: '#ffffff',
} as const;

const ENEMY_COLORS = [
  C.enemyRow0,
  C.enemyRow1,
  C.enemyRow2,
  C.enemyRow3,
  C.enemyRow4,
] as const;

// ─── Drawing helpers ──────────────────────────────────────────────────────────

function drawPlayer(ctx: CanvasRenderingContext2D, player: Player, frame: number): void {
  if (!player.alive) return;

  // Blink when invincible
  if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer / 5) % 2 === 0) return;

  const { x, y } = player.position;
  const bodyColor = player.invincibleTimer > 0 ? C.playerInvincible : C.playerBody;

  // Wings
  ctx.fillStyle = bodyColor;
  ctx.fillRect(x, y + 18, 32, 8);

  // Main body
  ctx.fillRect(x + 8, y + 6, 16, 22);

  // Nose
  ctx.fillRect(x + 12, y, 8, 8);

  // Cockpit
  ctx.fillStyle = C.playerCockpit;
  ctx.fillRect(x + 12, y + 8, 8, 10);

  // Engine flame (animated)
  const flameH = 4 + Math.floor(Math.sin(frame * 0.4) * 3);
  ctx.fillStyle = C.playerFlame;
  ctx.fillRect(x + 6, y + 28, 6, flameH);
  ctx.fillRect(x + 20, y + 28, 6, flameH);

  ctx.fillStyle = C.playerFlameInner;
  ctx.fillRect(x + 8, y + 28, 3, Math.max(1, flameH - 2));
  ctx.fillRect(x + 21, y + 28, 3, Math.max(1, flameH - 2));
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, frame: number): void {
  const { x, y } = enemy.position;
  const color = ENEMY_COLORS[Math.min(enemy.row, ENEMY_COLORS.length - 1)];
  const animPhase = Math.floor(frame / 20) % 2; // alternate every 20 frames

  ctx.fillStyle = color;

  if (enemy.row === 0) {
    // Top-row enemy: saucer shape
    ctx.fillRect(x + 8, y, 16, 4);
    ctx.fillRect(x + 2, y + 4, 28, 12);
    ctx.fillRect(x, y + 8, 32, 8);
    ctx.fillRect(x + 2, y + 16, 28, 6);
    // legs alternate
    if (animPhase === 0) {
      ctx.fillRect(x + 4, y + 22, 4, 4);
      ctx.fillRect(x + 24, y + 22, 4, 4);
    } else {
      ctx.fillRect(x + 8, y + 22, 4, 4);
      ctx.fillRect(x + 20, y + 22, 4, 4);
    }
  } else {
    // Standard enemy: classic invader body
    ctx.fillRect(x + 4, y, 24, 4);
    ctx.fillRect(x, y + 4, 32, 14);
    ctx.fillRect(x + 4, y + 18, 8, 6);
    ctx.fillRect(x + 20, y + 18, 8, 6);
    // antennae
    ctx.fillRect(x + 4, y - 4, 4, 4);
    ctx.fillRect(x + 24, y - 4, 4, 4);
    // legs alternate
    if (animPhase === 0) {
      ctx.fillRect(x, y + 18, 6, 4);
      ctx.fillRect(x + 26, y + 18, 6, 4);
    } else {
      ctx.fillRect(x + 4, y + 20, 6, 4);
      ctx.fillRect(x + 22, y + 20, 6, 4);
    }
  }

  // Eyes
  ctx.fillStyle = C.enemyEye;
  ctx.fillRect(x + 8, y + 6, 4, 4);
  ctx.fillRect(x + 20, y + 6, 4, 4);
}

function drawBullet(ctx: CanvasRenderingContext2D, bullet: Bullet): void {
  ctx.fillStyle = bullet.owner === 'player' ? C.bulletPlayer : C.bulletEnemy;
  ctx.fillRect(bullet.position.x, bullet.position.y, 4, 16);
  // bright core
  ctx.fillStyle = bullet.owner === 'player' ? '#aaffdd' : '#ffaa88';
  ctx.fillRect(bullet.position.x + 1, bullet.position.y + 2, 2, 12);
}

function drawStars(ctx: CanvasRenderingContext2D): void {
  for (const star of STARS) {
    const alpha = star.brightness;
    ctx.fillStyle = `rgba(200,220,255,${alpha})`;
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }
}

function drawHud(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.fillStyle = C.hudText;
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`SCORE  ${String(state.score).padStart(6, '0')}`, 12, 22);
  ctx.fillText(`LVL ${state.level}`, CANVAS_W / 2 - 20, 22);

  // Lives as hearts
  const HEART_SIZE = 14;
  const startX = CANVAS_W - 12 - 3 * (HEART_SIZE + 4);
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < state.player.lives ? C.hudLife : C.hudLifeEmpty;
    const hx = startX + i * (HEART_SIZE + 4);
    // Simple heart shape with fillRect
    ctx.fillRect(hx + 2, 8, HEART_SIZE - 4, 4);
    ctx.fillRect(hx, 10, HEART_SIZE, 6);
    ctx.fillRect(hx + 1, 16, HEART_SIZE - 2, 3);
    ctx.fillRect(hx + 3, 19, HEART_SIZE - 6, 2);
    ctx.fillRect(hx + 5, 21, HEART_SIZE - 10, 1);
  }

  // Divider line
  ctx.fillStyle = '#1a1a3a';
  ctx.fillRect(0, 30, CANVAS_W, 2);
}

// ─── Main render ──────────────────────────────────────────────────────────────

export function render(ctx: CanvasRenderingContext2D, state: GameState, frame: number): void {
  // Disable anti-aliasing for crisp pixel art
  ctx.imageSmoothingEnabled = false;

  // Background
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  drawStars(ctx);
  drawHud(ctx, state);

  // Enemies
  for (const enemy of state.enemies) {
    drawEnemy(ctx, enemy, frame);
  }

  // Bullets
  for (const bullet of state.bullets) {
    drawBullet(ctx, bullet);
  }

  // Player
  drawPlayer(ctx, state.player, frame);
}
