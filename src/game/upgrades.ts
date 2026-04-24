import type { GameState, Upgrade, UpgradeFamily } from './types';

const addGot = (state: GameState, key: string): GameState => ({
  ...state,
  got: [...state.got, key],
  acquiredUpgrades: [...state.got, key],
});

const unique = (state: GameState, key: string): boolean => !state.got.includes(key);

const UP = (
  key: string,
  title: string,
  body: string,
  apply: (state: GameState) => GameState,
  canTake: (state: GameState) => boolean,
  family: UpgradeFamily,
): Upgrade => ({ key, title, body, apply, canTake, family });

export const UPGRADES: Upgrade[] = [
  UP('damage', 'Heavy Bolts', '+1 projectile damage.', (s) => ({ ...addGot(s, 'damage'), player: { ...s.player, damage: s.player.damage + 1 } }), (s) => unique(s, 'damage'), 'Stats'),
  UP('splitVolley', 'Split Volley', '+1 projectile per attack.', (s) => ({ ...addGot(s, 'splitVolley'), player: { ...s.player, projectiles: s.player.projectiles + 1 } }), (s) => unique(s, 'splitVolley'), 'Stats'),
  UP('graveDrill', 'Grave Drill', '+1 pierce.', (s) => ({ ...addGot(s, 'graveDrill'), player: { ...s.player, pierce: s.player.pierce + 1 } }), (s) => unique(s, 'graveDrill'), 'Stats'),
  UP('rangeUp', 'Longshot', '+80 projectile range.', (s) => ({ ...addGot(s, 'rangeUp'), player: { ...s.player, range: s.player.range + 80 } }), (s) => unique(s, 'rangeUp'), 'Stats'),
  UP('moonstep', 'Moonstep', '+14% move speed.', (s) => ({ ...addGot(s, 'moonstep'), player: { ...s.player, moveSpeed: s.player.moveSpeed * 1.14 } }), (s) => unique(s, 'moonstep'), 'Stats'),
  UP('ironVeins', 'Iron Veins', '+2 max HP • Heal 2 • Blood Nuggets heal +1.', (s) => ({ ...addGot(s, 'ironVeins'), player: { ...s.player, maxHp: s.player.maxHp + 2, hp: Math.min(s.player.maxHp + 2, s.player.hp + 2) }, systems: { ...s.systems, bloodNuggetHeal: s.systems.bloodNuggetHeal + 1 } }), (s) => unique(s, 'ironVeins'), 'Stats'),
  UP('overdraw', 'Overdraw', 'Shots cost 0.45 HP • -30% cooldown • +1 damage • +5% Blood Nugget chance.', (s) => ({ ...addGot(s, 'overdraw'), player: { ...s.player, overdraw: true, overdrawHpCost: 0.45, cooldown: Math.max(0.14, s.player.cooldown * 0.7), damage: s.player.damage + 1 }, systems: { ...s.systems, bloodNuggetDropChance: Math.min(0.4, s.systems.bloodNuggetDropChance + 0.05) } }), (s) => unique(s, 'overdraw'), 'Blood'),
  UP('leechBolts', 'Leech Bolts', '+0.12 HP per projectile hit.', (s) => ({ ...addGot(s, 'leechBolts'), player: { ...s.player, leechOnHit: s.player.leechOnHit + 0.12 } }), (s) => unique(s, 'leechBolts'), 'Blood'),
  UP('freshVeins', 'Fresh Veins', 'Blood Nuggets heal +1 • +8% drop chance • +18 pickup range.', (s) => ({ ...addGot(s, 'freshVeins'), player: { ...s.player, magnet: s.player.magnet + 18 }, systems: { ...s.systems, bloodNuggetHeal: s.systems.bloodNuggetHeal + 1, bloodNuggetDropChance: Math.min(0.55, s.systems.bloodNuggetDropChance + 0.08) } }), (s) => unique(s, 'freshVeins'), 'Blood'),
  UP('redSurge', 'Red Surge', 'Excess healing converts to decaying shield.', (s) => ({ ...addGot(s, 'redSurge'), player: { ...s.player, overhealShield: true } }), (s) => unique(s, 'redSurge'), 'Blood'),
  UP('hemorrhageEngine', 'Hemorrhage Engine', '+1.2x damage scaling based on missing HP.', (s) => ({ ...addGot(s, 'hemorrhageEngine'), player: { ...s.player, missingHpDamageScale: s.player.missingHpDamageScale + 1.2 } }), (s) => unique(s, 'hemorrhageEngine'), 'Blood'),
  UP('momentum', 'Momentum', 'Movement builds momentum • Up to +45% attack rate • Up to +25% damage.', (s) => ({ ...addGot(s, 'momentum'), player: { ...s.player, momentumEnabled: true, momentumAttackRate: s.player.momentumAttackRate + 0.45, momentumDamage: s.player.momentumDamage + 0.25 } }), (s) => unique(s, 'momentum'), 'Momentum'),
  UP('trailBite', 'Trail Bite', 'Leaves trail dealing 4 DPS while moving.', (s) => ({ ...addGot(s, 'trailBite'), player: { ...s.player, trailEnabled: true, trailDamagePerSecond: s.player.trailDamagePerSecond + 4 } }), (s) => unique(s, 'trailBite'), 'Momentum'),
  UP('harvestLine', 'Harvest Line', 'XP pickup grants haste for a short duration.', (s) => ({ ...addGot(s, 'harvestLine'), player: { ...s.player, harvestLineEnabled: true, pickupHasteStrength: s.player.pickupHasteStrength + 0.22 } }), (s) => unique(s, 'harvestLine'), 'Momentum'),
  UP('runnersHunger', "Runner's Hunger", '+36 pickup range at max momentum.', (s) => ({ ...addGot(s, 'runnersHunger'), player: { ...s.player, momentumMagnetBonus: s.player.momentumMagnetBonus + 36 } }), (s) => unique(s, 'runnersHunger'), 'Momentum'),
  UP('driftVolley', 'Drift Volley', '+1 pierce while moving.', (s) => ({ ...addGot(s, 'driftVolley'), player: { ...s.player, movingPierceBonus: s.player.movingPierceBonus + 1 } }), (s) => unique(s, 'driftVolley'), 'Momentum'),
  UP('corpseBloom', 'Corpse Bloom', 'On death: explode (radius +34 • damage +6).', (s) => ({ ...addGot(s, 'corpseBloom'), systems: { ...s.systems, corpseExplosionRadius: s.systems.corpseExplosionRadius + 34, corpseExplosionDamage: s.systems.corpseExplosionDamage + 6 } }), (s) => unique(s, 'corpseBloom'), 'Bloom'),
  UP('ashWake', 'Ash Wake', 'Explosions create zones dealing +8 DPS.', (s) => ({ ...addGot(s, 'ashWake'), systems: { ...s.systems, ashWakeEnabled: true, ashWakeDps: s.systems.ashWakeDps + 8, ashWakeDuration: s.systems.ashWakeDuration + 0.7 } }), (s) => unique(s, 'ashWake') && s.systems.corpseExplosionRadius > 0, 'Bloom'),
  UP('funeralHeat', 'Funeral Heat', 'Explosion kills grant +45% attack rate briefly.', (s) => ({ ...addGot(s, 'funeralHeat'), systems: { ...s.systems, funeralHeatEnabled: true, funeralHeatAttackRate: s.systems.funeralHeatAttackRate + 0.45 } }), (s) => unique(s, 'funeralHeat') && s.systems.corpseExplosionRadius > 0, 'Bloom'),
  UP('chainLedger', 'Chain Ledger', '+1 XP per explosion kill.', (s) => ({ ...addGot(s, 'chainLedger'), systems: { ...s.systems, chainXpBonus: s.systems.chainXpBonus + 1 } }), (s) => unique(s, 'chainLedger') && s.systems.corpseExplosionRadius > 0, 'Bloom'),
  UP('bloomRadius', 'Bloom Radius', '+24 explosion radius • +5 explosion damage.', (s) => ({ ...addGot(s, 'bloomRadius'), systems: { ...s.systems, corpseExplosionRadius: s.systems.corpseExplosionRadius + 24, corpseExplosionDamage: s.systems.corpseExplosionDamage + 5 } }), (s) => unique(s, 'bloomRadius') && s.systems.corpseExplosionRadius > 0, 'Bloom'),
];

export const upgradeByKey = (key: string): Upgrade | undefined => UPGRADES.find((u) => u.key === key);

const pickRandomNoReplace = <T,>(list: T[], n: number): T[] => {
  const copy = [...list];
  const out: T[] = [];
  while (copy.length > 0 && out.length < n) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
};

export const sampleUpgrades = (state: GameState): Upgrade[] => {
  const candidates = UPGRADES.filter((u) => u.canTake(state));
  const stats = candidates.filter((u) => u.family === 'Stats');
  const nonStats = candidates.filter((u) => u.family !== 'Stats');
  const primary = pickRandomNoReplace(stats, Math.min(1, stats.length));
  const secondaryPool = nonStats.length ? nonStats : stats;
  const secondary = pickRandomNoReplace(secondaryPool, 3 - primary.length);
  return [...primary, ...secondary].filter((u, i, arr) => arr.findIndex((v) => v.key === u.key) === i).slice(0, 3);
};
