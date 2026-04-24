export type GamePhase = 'start' | 'playing' | 'levelup' | 'waveEnd' | 'synthesis' | 'dead' | 'won';

export type UpgradeFamily = 'Stats' | 'Blood' | 'Momentum' | 'Bloom' | 'General';

export interface PlayerState {
  x: number;
  y: number;
  weaponKey: string | null;
  hp: number;
  maxHp: number;
  shield: number;
  moveSpeed: number;
  cooldown: number;
  damage: number;
  projectiles: number;
  range: number;
  pierce: number;
  magnet: number;
  hitFlash: number;
  isMoving: boolean;
  overdraw: boolean;
  overdrawHpCost: number;
  leechOnHit: number;
  overhealShield: boolean;
  missingHpDamageScale: number;
  momentumEnabled: boolean;
  momentumMeter: number;
  momentumAttackRate: number;
  momentumDamage: number;
  trailEnabled: boolean;
  trailDamagePerSecond: number;
  pickupHasteTime: number;
  pickupHasteStrength: number;
  harvestLineEnabled: boolean;
  momentumMagnetBonus: number;
  movingPierceBonus: number;
  weaponSpread: number;
  movingDamageBonus: number;
  shotSpeed: number;
  shotSize: number;
  shotColor: string;
  shotStyle: 'bolt' | 'needle' | 'boomerang' | 'bloom';
  boomRate: number;
  boomDot: number;
  boomDotTime: number;
}

export interface SystemsState {
  baseBloodNuggetDropChance: number;
  bloodNuggetDropChance: number;
  bloodNuggetHeal: number;
  corpseExplosionRadius: number;
  corpseExplosionDamage: number;
  ashWakeEnabled: boolean;
  ashWakeDps: number;
  ashWakeDuration: number;
  funeralHeatEnabled: boolean;
  funeralHeatAttackRate: number;
  funeralHeatTime: number;
  chainXpBonus: number;
}

export interface Enemy {
  id: string;
  x: number;
  y: number;
  r: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  color: string;
  elite: boolean;
  moveType: 'chaser' | 'orbit' | 'zigzag' | 'scout' | 'tank';
  flankDir: number;
  packSlot: number;
  laneBias: number;
  trapRange: number;
  phase: number;
  dotTime: number;
  dotDps: number;
  [k: string]: unknown;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  px: number;
  py: number;
  ox: number;
  oy: number;
  tid: string;
  tx: number;
  ty: number;
  bx: number;
  by: number;
  didBounce: boolean;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  damage: number;
  dotDps: number;
  dotTime: number;
  pierceLeft: number;
  size: number;
  color: string;
  style: PlayerState['shotStyle'];
  hitIds: string[];
  curve: number;
  baseAngle: number;
  spin: number;
}

export interface Drop {
  id: string;
  x: number;
  y: number;
  value: number;
  type: 'xp' | 'heal';
}

export interface SpawnWarning {
  id: string;
  x: number;
  y: number;
  r: number;
  life: number;
  maxLife: number;
  enemy: Enemy;
}

export interface Floater {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  vy: number;
}

export interface AreaZone {
  id: string;
  x: number;
  y: number;
  radius: number;
  life: number;
}

export interface ExplosionFx {
  id: string;
  x: number;
  y: number;
  r: number;
  life: number;
}

export interface Upgrade {
  key: string;
  title: string;
  body: string;
  family: UpgradeFamily;
  canTake: (state: GameState) => boolean;
  apply: (state: GameState) => GameState;
}

export interface Weapon {
  k: string;
  title: string;
  role: string;
  stats: Array<{ label: string; value: string }>;
  effect: string;
  player: Partial<PlayerState>;
  systems: Partial<SystemsState>;
  message: string;
  apply: (player: PlayerState, systems: SystemsState) => { player: PlayerState; systems: SystemsState; message: string };
}

export interface GameState {
  phase: GamePhase;
  time: number;
  wave: number;
  waveTime: number;
  level: number;
  xp: number;
  xpTarget: number;
  pendingLevelUps: number;
  kills: number;
  player: PlayerState;
  systems: SystemsState;
  enemies: Enemy[];
  projectiles: Projectile[];
  drops: Drop[];
  trail: AreaZone[];
  ash: AreaZone[];
  expl: ExplosionFx[];
  floaters: Floater[];
  spawns: SpawnWarning[];
  messages: string[];
  offered: Upgrade[];
  got: string[];
  acquiredUpgrades: string[];
  permKeys: string[];
  wavePicks: string[];
  synthKeep: string[];
  synthBurn: string[];
  juice: number;
  spawnBudget: number;
  spawnCooldown: number;
  invuln: number;
}

export interface KeyboardState {
  [key: string]: boolean;
}

export interface TapMoveState {
  active: boolean;
  x: number;
  y: number;
}
