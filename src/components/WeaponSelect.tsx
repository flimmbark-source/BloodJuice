import { WEAPONS } from '../game/weapons';

export function WeaponSelect({ onChoose }: { onChoose: (k: string) => void }) {
  return (
    <div>
      <h2>Choose a starting weapon</h2>
      <p className="start-tutorial">
        Quick tutorial: Move with <strong>WASD</strong> or arrows, keep kiting enemies, and aim with your cursor or touch direction.
        Fill XP to level up, pick upgrades between waves, then use Synthesis to keep or burn picks for juice.
      </p>
      <div className="grid">
        {WEAPONS.map((w) => (
          <button key={w.k} onClick={() => onChoose(w.k)} className="card">
            <h3>{w.title}</h3>
            <p>{w.role}</p>
            <small>{w.effect}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
