import { initGame } from './initialState';
import { juiceMeta } from './juice';
import { groupedSpawnSpread, spawnGroup } from './spawning';
import { sampleUpgrades, upgradeByKey } from './upgrades';
import { beginNextWave, rebuildPermanent } from './wave';
import { waveLen } from './constants';
import { synthBurn, synthKeep } from './simulation';

export const selfCheck = (): void => {
  const g = initGame();

  if (waveLen(1) < 20 || waveLen(3) < waveLen(1)) throw new Error('waveLen_invalid');

  const up = upgradeByKey('damage');
  if (!up) throw new Error('missing_upgrade');
  const jm = juiceMeta(up);
  if (jm.cost < 2 || jm.gain < 1) throw new Error('juice_meta');

  const group = spawnGroup(20);
  if (groupedSpawnSpread(group) > 120) throw new Error('spawn_group_spread');

  const sampled = sampleUpgrades(g).map((u) => u.key);
  if (new Set(sampled).size !== sampled.length) throw new Error('sample_duplicates');

  const perm = rebuildPermanent({ ...g, player: { ...g.player, weaponKey: 'graveWand' } }, ['damage']);
  if (!perm.got.includes('damage') || perm.got.some((k) => k !== 'damage')) throw new Error('rebuildPermanent_keys');

  const synthBase = { ...g, phase: 'synthesis' as const, wavePicks: ['damage'], juice: 0 };
  if (synthKeep(synthBase, up).synthKeep.length !== 0) throw new Error('stabilize_without_juice');

  const enough = { ...synthBase, juice: 99 };
  const kept = synthKeep(enough, up);
  const both = synthBurn(kept, up);
  if (both.synthBurn.includes(up.key)) throw new Error('keep_and_burn_same_upgrade');

  const next = beginNextWave({ ...kept, phase: 'synthesis' as const, player: { ...kept.player, weaponKey: 'graveWand' } });
  if (next.wavePicks.length !== 0 || next.synthKeep.length !== 0 || next.synthBurn.length !== 0) throw new Error('next_wave_not_cleared');

  if (!Array.isArray(g.particles) || !Array.isArray(g.ripples)) throw new Error('fx_slots_missing');
  if (!Array.isArray(next.particles) || !Array.isArray(next.ripples) || next.particles.length !== 0 || next.ripples.length !== 0) throw new Error('fx_slots_not_cleared');
};
