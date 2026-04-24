import type { PlayerState, SystemsState, Weapon } from './types';
import { BASE_SYSTEMS } from './initialState';

const defineWeapon = (
  k: string,
  title: string,
  role: string,
  stats: Weapon['stats'],
  effect: string,
  player: Partial<PlayerState>,
  systems: Partial<SystemsState>,
  message: string,
): Weapon => ({
  k,
  title,
  role,
  stats,
  effect,
  player,
  systems,
  message,
  apply: (basePlayer, baseSystems) => ({
    player: { ...basePlayer, weaponKey: k, ...player },
    systems: { ...baseSystems, ...systems },
    message,
  }),
});

export const WEAPONS: Weapon[] = [
  defineWeapon(
    'graveWand',
    'Grave Wand',
    'Balanced',
    [
      { label: 'Damage', value: '2.2' },
      { label: 'Range', value: '340' },
      { label: 'Speed', value: '0.72' },
    ],
    'Steady all-around starter.',
    { damage: 2.2, cooldown: 0.72, range: 340, shotSpeed: 160, weaponSpread: 0 },
    { bloodNuggetDropChance: BASE_SYSTEMS.baseBloodNuggetDropChance, corpseExplosionRadius: 0, corpseExplosionDamage: 0 },
    'Grave Wand equipped.',
  ),
  defineWeapon(
    'bloodNeedle',
    'Blood Needle',
    'Risk / DPS',
    [
      { label: 'Damage', value: '1.2' },
      { label: 'Range', value: '220' },
      { label: 'Speed', value: '0.38' },
    ],
    'Rapid shots. Costs HP to fire and drops more Blood Nuggets.',
    { damage: 1.2, cooldown: 0.38, range: 220, overdraw: true, overdrawHpCost: 0.1, shotSpeed: 310, shotSize: 3, shotColor: '#fb7185', shotStyle: 'needle', weaponSpread: 0 },
    { bloodNuggetDropChance: BASE_SYSTEMS.baseBloodNuggetDropChance + 0.1 },
    'Blood Needle equipped.',
  ),
  defineWeapon(
    'sickleArc',
    'Sickle Arc',
    'Mobile',
    [
      { label: 'Damage', value: '2.8/s' },
      { label: 'Range', value: '175' },
      { label: 'Speed', value: '0.90' },
    ],
    'A spinning sickle hunts a target, then inflicts damage over time.',
    { damage: 0, cooldown: 0.9, range: 175, pierce: 1, shotSpeed: 210, shotSize: 7, shotColor: '#86efac', shotStyle: 'boomerang', boomRate: 0.5, boomDot: 2.8, boomDotTime: 1.2, movingDamageBonus: 0.2, weaponSpread: 0 },
    {},
    'Sickle Arc equipped.',
  ),
  defineWeapon(
    'bloomStaff',
    'Bloom Staff',
    'AoE',
    [
      { label: 'Damage', value: '1.3' },
      { label: 'Range', value: '380' },
      { label: 'Speed', value: '0.82' },
    ],
    'Kills explode and damage nearby enemies.',
    { damage: 1.3, cooldown: 0.82, range: 380, shotSpeed: 170, shotSize: 7, shotColor: '#fbbf24', shotStyle: 'bloom', weaponSpread: 0 },
    { corpseExplosionRadius: 42, corpseExplosionDamage: 4 },
    'Bloom Staff equipped.',
  ),
];

export const weaponByKey = (key: string | null): Weapon => WEAPONS.find((w) => w.k === key) ?? WEAPONS[0];
