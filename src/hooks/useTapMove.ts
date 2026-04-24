import { useRef } from 'react';
import type { TapMoveState } from '../game/types';

export const useTapMove = () => {
  const tapMoveRef = useRef<TapMoveState>({ active: false, x: 0, y: 0 });

  const setTapTarget = (x: number, y: number): void => {
    tapMoveRef.current = { active: true, x, y };
  };

  const clearTapTarget = (): void => {
    tapMoveRef.current = { ...tapMoveRef.current, active: false };
  };

  return { tapMoveRef, setTapTarget, clearTapTarget };
};
