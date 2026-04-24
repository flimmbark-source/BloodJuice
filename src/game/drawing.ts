import { ARENA_HEIGHT, ARENA_WIDTH, DROP_RADIUS, PLAYER_RADIUS } from './constants';
import type { Enemy, GameState, Projectile } from './types';

export const drawCircle = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  fill: string | null,
  stroke?: string,
  width = 1,
): void => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.lineWidth = width;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
};

export const drawProjectile = (ctx: CanvasRenderingContext2D, p: Projectile): void => {
  drawCircle(ctx, p.x, p.y, p.size, p.color);
};

export const drawEnemy = (ctx: CanvasRenderingContext2D, e: Enemy): void => {
  drawCircle(ctx, e.x, e.y, e.r, e.color, 'rgba(255,255,255,.4)', 1.5);
};

export const drawGame = (ctx: CanvasRenderingContext2D, game: GameState): void => {
  ctx.clearRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
  const bg = ctx.createLinearGradient(0, 0, 0, ARENA_HEIGHT);
  bg.addColorStop(0, '#0b1020');
  bg.addColorStop(1, '#111827');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

  game.drops.forEach((d) => drawCircle(ctx, d.x, d.y, DROP_RADIUS, d.type === 'heal' ? '#fb7185' : '#34d399'));
  game.projectiles.forEach((p) => drawProjectile(ctx, p));
  game.enemies.forEach((e) => drawEnemy(ctx, e));
  if (game.player.shield > 0) drawCircle(ctx, game.player.x, game.player.y, PLAYER_RADIUS + 7, null, 'rgba(34,211,238,.65)', 2);
  drawCircle(ctx, game.player.x, game.player.y, PLAYER_RADIUS, game.player.hitFlash > 0 ? '#fb7185' : '#60a5fa', 'rgba(255,255,255,.7)', 3);
};
