import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { ARENA_HEIGHT, ARENA_WIDTH } from '../game/constants';
import { drawGame } from '../game/drawing';
import type { GameState } from '../game/types';

interface Props {
  game: GameState;
  onTapMove: (x: number, y: number) => void;
  onTapEnd: () => void;
}

export function GameCanvas({ game, onTapMove, onTapEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    drawGame(ctx, game);
  }, [game]);

  const pointerToWorld = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const relX = (clientX - rect.left) / rect.width;
    const relY = (clientY - rect.top) / rect.height;
    return { x: relX * ARENA_WIDTH, y: relY * ARENA_HEIGHT };
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>): void => {
    const world = pointerToWorld(e.clientX, e.clientY);
    if (!world) return;
    onTapMove(world.x, world.y);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>): void => {
    if (e.buttons === 0) return;
    const world = pointerToWorld(e.clientX, e.clientY);
    if (!world) return;
    onTapMove(world.x, world.y);
  };

  return (
    <canvas
      ref={canvasRef}
      width={ARENA_WIDTH}
      height={ARENA_HEIGHT}
      className="game-canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={onTapEnd}
      onPointerCancel={onTapEnd}
      onPointerLeave={onTapEnd}
    />
  );
}
