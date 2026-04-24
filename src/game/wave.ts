import { ARENA_HEIGHT, ARENA_WIDTH, waveLen } from './constants';
import { BASE_PLAYER, BASE_SYSTEMS } from './initialState';
import { sampleUpgrades, upgradeByKey } from './upgrades';
import { weaponByKey } from './weapons';
import type { GameState } from './types';

export const enterLevelUpIfNeeded = (state: GameState): GameState => {
  if (state.pendingLevelUps <= 0) return state;
  return {
    ...state,
    phase: 'levelup',
    pendingLevelUps: state.pendingLevelUps - 1,
    offered: sampleUpgrades(state),
    messages: [`Level ${state.level}. Choose an upgrade.`],
  };
};

export const rebuildPermanent = (prev: GameState, keys: string[]): GameState => {
  const weapon = weaponByKey(prev.player.weaponKey).apply({ ...BASE_PLAYER }, { ...BASE_SYSTEMS });
  let state: GameState = {
    ...prev,
    player: {
      ...weapon.player,
      x: ARENA_WIDTH / 2,
      y: ARENA_HEIGHT / 2,
      hp: Math.min(prev.player.hp, weapon.player.maxHp),
      shield: 0,
      hitFlash: 0,
      momentumMeter: 0,
    },
    systems: { ...weapon.systems },
    got: [],
    acquiredUpgrades: [],
  };

  for (const k of keys) {
    const upgrade = upgradeByKey(k);
    if (upgrade) {
      state = upgrade.apply(state);
    }
  }

  return { ...state, permKeys: [...keys] };
};

export const beginNextWave = (prev: GameState): GameState => {
  const keys = [...new Set([...prev.permKeys, ...prev.synthKeep])];
  const base = rebuildPermanent(prev, keys);
  const wave = prev.wave + 1;
  return {
    ...base,
    phase: 'playing',
    wave,
    waveTime: waveLen(wave),
    time: prev.time,
    level: prev.level,
    xp: prev.xp,
    xpTarget: prev.xpTarget,
    pendingLevelUps: 0,
    kills: prev.kills,
    juice: prev.juice,
    permKeys: keys,
    wavePicks: [],
    synthKeep: [],
    synthBurn: [],
    offered: [],
    enemies: [],
    spawns: [],
    projectiles: [],
    drops: [],
    trail: [],
    ash: [],
    expl: [],
    floaters: [],
    spawnBudget: 0,
    spawnCooldown: 1.2,
    messages: [`Wave ${wave} begins.`],
  };
};
