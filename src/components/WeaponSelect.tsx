import { WEAPONS } from '../game/weapons';

export function WeaponSelect({ onChoose }: { onChoose: (k: string) => void }) {
  return (
    <div>
      <h2>Choose a starting weapon</h2>
      
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
