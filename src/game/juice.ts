import type { GameState, Upgrade } from './types';

const hash = (s: string): number => [...s].reduce((a, c) => a + c.charCodeAt(0), 0);

export const juiceMeta = (upgrade: Upgrade): { cost: number; gain: number } => {
  const base =
    {
      Stats: [2, 1],
      Blood: [3, 2],
      Momentum: [3, 2],
      Bloom: [4, 2],
      General: [3, 1],
    }[upgrade.family] ?? [3, 1];

  const h = hash(upgrade.key);
  return { cost: base[0] + (h % 3), gain: base[1] + (h % 2) };
};

export const canStabilize = (state: GameState, key: string, cost: number): boolean =>
  state.phase === 'synthesis' && !state.synthKeep.includes(key) && !state.synthBurn.includes(key) && state.juice >= cost;

export const canRender = (state: GameState, key: string): boolean =>
  state.phase === 'synthesis' && !state.synthKeep.includes(key) && !state.synthBurn.includes(key);
