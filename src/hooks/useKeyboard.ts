import { useEffect, useRef } from 'react';
import type { KeyboardState } from '../game/types';

export const useKeyboard = (): React.MutableRefObject<KeyboardState> => {
  const keysRef = useRef<KeyboardState>({});

  useEffect(() => {
    const down = (e: KeyboardEvent): void => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    };
    const up = (e: KeyboardEvent): void => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  return keysRef;
};
