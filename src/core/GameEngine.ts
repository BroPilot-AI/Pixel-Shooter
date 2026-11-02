import type { GameState, Player, Bullet, Enemy, Star } from './types';

export const CANVAS_W = 800;
export const CANVAS_H = 600;

const PLAYER_W = 32;
const PLAYER_H = 32;
const PLAYER_SPEED = 5;
const PLAYER_SHOOT_COOLDOWN = 15;
const INVINCIBLE_DURATION = 120;

const BULLET_W = 4;
const BULLET_H = 16;
const PLAYER_BULLET_VY = -12;
const ENEMY_BULLET_VY = 5;

const ENEMY_W = 32;
const ENEMY_H = 24;
const ENEMY_COLS = 10;
const ENEMY_ROWS = 3;
const ENEMY_SPACING_X = 64;
const ENEMY_SPACING_Y = 48;
const ENEMY_SHOOT_CHANCE = 0.0015;
const ENEMY_BASE_SPEED = 0.8;
const ENEMY_SPEED_PER_LEVEL = 0.25;
const ENEMY_DROP = 24;

// Pre-generated static stars — never changes
export const STARS: readonly Star[] = (() => {
  const result: Star[] = [];
  // deterministic: use a simple seeded sequence
  let seed = 42;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  };
  for (let i = 0; i < 120; i++) {
    result.push({
      x: Math.floor(rand() * CANVAS_W),
      y: Math.floor(rand() * CANVAS_H),
      size: rand() < 0.7 ? 1 : 2,
      brightness: 0.4 + rand() * 0.6,
    });
  }
  return result;
})();

let _idCounter = 0;
function newId(): string {
  return `e${++_idCounter}`;
}

function spawnEnemies(level: number): readonly Enemy[] {
  const rows = Math.min(ENEMY_ROWS + Math.floor(level / 2), 5);
  const startX = (CANVAS_W - ENEMY_COLS * ENEMY_SPACING_X) / 2 + 8;
  const startY = 60;
  const enemies: Enemy[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < ENEMY_COLS; col++) {
      enemies.push({
        id: newId(),
        position: { x: startX + col * ENEMY_SPACING_X, y: startY + row * ENEMY_SPACING_Y },
        width: ENEMY_W,
        height: ENEMY_H,
        row,
        shootCooldown: Math.floor(60 + Math.random() * 180),
        alive: true,
      });
    }
  }
  return enemies;
}

export function initGameState(): GameState {
  return {
    player: {
      position: { x: CANVAS_W / 2 - PLAYER_W / 2, y: CANVAS_H - 72 },
      width: PLAYER_W,
      height: PLAYER_H,
      lives: 3,
      shootCooldown: 0,
      invincibleTimer: 0,
      alive: true,
    },
    bullets: [],
    enemies: spawnEnemies(1),
    score: 0,
    level: 1,
    enemyDx: ENEMY_BASE_SPEED,
    status: 'playing',
  };
}

// ─── Pure update functions ────────────────────────────────────────────────────

function movePlayer(keys: ReadonlySet<string>, state: GameState): GameState {
  const { player } = state;
  const dx =
    (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0) -
    (keys.has('ArrowLeft') || keys.has('KeyA') ? 1 : 0);
  const dy =
    (keys.has('ArrowDown') || keys.has('KeyS') ? 1 : 0) -
    (keys.has('ArrowUp') || keys.has('KeyW') ? 1 : 0);

  const nx = Math.max(0, Math.min(CANVAS_W - player.width, player.position.x + dx * PLAYER_SPEED));
  const ny = Math.max(CANVAS_H * 0.45, Math.min(CANVAS_H - player.height, player.position.y + dy * PLAYER_SPEED));

  const invincibleTimer = player.invincibleTimer > 0 ? player.invincibleTimer - 1 : 0;

  return {
    ...state,
    player: { ...player, position: { x: nx, y: ny }, invincibleTimer },
  };
}

function handlePlayerShooting(keys: ReadonlySet<string>, state: GameState): GameState {
  const { player } = state;
  const cooldown = player.shootCooldown > 0 ? player.shootCooldown - 1 : 0;

  if (cooldown > 0 || !keys.has('Space')) {
    return { ...state, player: { ...player, shootCooldown: cooldown } };
  }

  const bullet: Bullet = {
    id: newId(),
    position: {
      x: player.position.x + player.width / 2 - BULLET_W / 2,
      y: player.position.y - BULLET_H,
    },
    vy: PLAYER_BULLET_VY,
    owner: 'player',
    alive: true,
  };

  return {
    ...state,
    player: { ...player, shootCooldown: PLAYER_SHOOT_COOLDOWN },
    bullets: [...state.bullets, bullet],
  };
}

function moveEnemies(state: GameState): GameState {
  if (state.enemies.length === 0) return state;

  const dx = state.enemyDx;
  const tentative = state.enemies.map(e => ({
    ...e,
    position: { x: e.position.x + dx, y: e.position.y },
  }));

  const hitWall = tentative.some(
    e => e.position.x <= 0 || e.position.x + e.width >= CANVAS_W,
  );

  if (!hitWall) {
    return { ...state, enemies: tentative };
  }

  // Reverse and drop
  const dropped = state.enemies.map(e => ({
    ...e,
    position: { x: e.position.x, y: e.position.y + ENEMY_DROP },
  }));

  return { ...state, enemies: dropped, enemyDx: -dx };
}

function handleEnemyShooting(state: GameState): GameState {
  const newBullets: Bullet[] = [];

  const updatedEnemies = state.enemies.map(enemy => {
    const cooldown = enemy.shootCooldown > 0 ? enemy.shootCooldown - 1 : 0;
    if (cooldown === 0 && Math.random() < ENEMY_SHOOT_CHANCE) {
      newBullets.push({
        id: newId(),
        position: {
          x: enemy.position.x + enemy.width / 2 - BULLET_W / 2,
          y: enemy.position.y + enemy.height,
        },
        vy: ENEMY_BULLET_VY,
        owner: 'enemy',
        alive: true,
      });
      return { ...enemy, shootCooldown: 60 + Math.floor(Math.random() * 180) };
    }
    return cooldown !== enemy.shootCooldown ? { ...enemy, shootCooldown: cooldown } : enemy;
  });

  if (newBullets.length === 0) return { ...state, enemies: updatedEnemies };
  return { ...state, enemies: updatedEnemies, bullets: [...state.bullets, ...newBullets] };
}

function moveBullets(state: GameState): GameState {
  return {
    ...state,
    bullets: state.bullets.map(b => ({
      ...b,
      position: { x: b.position.x, y: b.position.y + b.vy },
    })),
  };
}

function aabb(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function resolveCollisions(state: GameState): GameState {
  let { score } = state;
  const hitBulletIds = new Set<string>();
  const hitEnemyIds = new Set<string>();
  let playerHit = false;

  const { player } = state;

  for (const bullet of state.bullets) {
    if (!bullet.alive) continue;
    const { x: bx, y: by } = bullet.position;

    if (bullet.owner === 'player') {
      for (const enemy of state.enemies) {
        if (!enemy.alive) continue;
        if (aabb(bx, by, BULLET_W, BULLET_H, enemy.position.x, enemy.position.y, enemy.width, enemy.height)) {
          hitBulletIds.add(bullet.id);
          hitEnemyIds.add(enemy.id);
          score += enemy.row === 0 ? 20 : 10;
        }
      }
    } else if (bullet.owner === 'enemy' && player.alive && player.invincibleTimer === 0) {
      if (aabb(bx, by, BULLET_W, BULLET_H, player.position.x, player.position.y, player.width, player.height)) {
        hitBulletIds.add(bullet.id);
        playerHit = true;
      }
    }
  }

  // Enemy-player direct contact
  if (player.alive && player.invincibleTimer === 0) {
    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;
      if (aabb(player.position.x, player.position.y, player.width, player.height,
               enemy.position.x, enemy.position.y, enemy.width, enemy.height)) {
        playerHit = true;
        break;
      }
    }
  }

  const newLives = playerHit ? player.lives - 1 : player.lives;
  const playerAlive = newLives > 0;
  const gameOver = !playerAlive;

  const newPlayer: Player = playerHit
    ? {
        ...player,
        lives: newLives,
        alive: playerAlive,
        invincibleTimer: playerAlive ? INVINCIBLE_DURATION : 0,
        position: playerAlive
          ? { x: CANVAS_W / 2 - PLAYER_W / 2, y: CANVAS_H - 72 }
          : player.position,
      }
    : player;

  return {
    ...state,
    score,
    status: gameOver ? 'gameover' : state.status,
    player: newPlayer,
    bullets: state.bullets.map(b => (hitBulletIds.has(b.id) ? { ...b, alive: false } : b)),
    enemies: state.enemies.map(e => (hitEnemyIds.has(e.id) ? { ...e, alive: false } : e)),
  };
}

function cleanup(state: GameState): GameState {
  return {
    ...state,
    bullets: state.bullets.filter(
      b => b.alive && b.position.y > -BULLET_H - 10 && b.position.y < CANVAS_H + 10,
    ),
    enemies: state.enemies.filter(e => e.alive),
  };
}

function checkLevelComplete(state: GameState): GameState {
  if (state.status !== 'playing' || state.enemies.length > 0) return state;

  const nextLevel = state.level + 1;
  const newSpeed = ENEMY_BASE_SPEED + (nextLevel - 1) * ENEMY_SPEED_PER_LEVEL;

  return {
    ...state,
    level: nextLevel,
    enemyDx: newSpeed,
    enemies: spawnEnemies(nextLevel),
    bullets: [], // clear bullets on level transition
  };
}

function checkEnemiesReachedBottom(state: GameState): GameState {
  if (state.status !== 'playing') return state;
  const reached = state.enemies.some(e => e.position.y + e.height >= CANVAS_H - 60);
  if (!reached) return state;
  return { ...state, status: 'gameover' };
}

function handleRestart(keys: ReadonlySet<string>, state: GameState): GameState {
  if (keys.has('KeyR') || keys.has('Enter')) {
    return initGameState();
  }
  return state;
}

// ─── Main tick ────────────────────────────────────────────────────────────────

export function tick(keys: ReadonlySet<string>, state: GameState): GameState {
  if (state.status === 'gameover') {
    return handleRestart(keys, state);
  }

  return (
    [
      (s: GameState) => movePlayer(keys, s),
      (s: GameState) => handlePlayerShooting(keys, s),
      (s: GameState) => moveEnemies(s),
      (s: GameState) => handleEnemyShooting(s),
      (s: GameState) => moveBullets(s),
      (s: GameState) => resolveCollisions(s),
      (s: GameState) => cleanup(s),
      (s: GameState) => checkLevelComplete(s),
      (s: GameState) => checkEnemiesReachedBottom(s),
    ] as Array<(s: GameState) => GameState>
  ).reduce((s, fn) => fn(s), state);
}
