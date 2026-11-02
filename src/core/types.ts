export type Vector2 = { readonly x: number; readonly y: number };

export interface Player {
  readonly position: Vector2;
  readonly width: number;
  readonly height: number;
  readonly lives: number;
  readonly shootCooldown: number;
  readonly invincibleTimer: number;
  readonly alive: boolean;
}

export interface Bullet {
  readonly id: string;
  readonly position: Vector2;
  readonly vy: number;
  readonly owner: 'player' | 'enemy';
  readonly alive: boolean;
}

export interface Enemy {
  readonly id: string;
  readonly position: Vector2;
  readonly width: number;
  readonly height: number;
  readonly row: number;
  readonly shootCooldown: number;
  readonly alive: boolean;
}

export interface GameState {
  readonly player: Player;
  readonly bullets: readonly Bullet[];
  readonly enemies: readonly Enemy[];
  readonly score: number;
  readonly level: number;
  readonly enemyDx: number;
  readonly status: 'playing' | 'gameover';
}

export interface Star {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly brightness: number;
}
