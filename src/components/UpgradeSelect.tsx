import type { Upgrade } from '../game/types';

export function UpgradeSelect({ upgrades, onChoose }: { upgrades: Upgrade[]; onChoose: (u: Upgrade) => void }) {
  return (
    <div>
      <h2>Choose an upgrade</h2>
      <div className="grid">
        {upgrades.map((u) => (
          <button key={u.key} onClick={() => onChoose(u)} className="card">
            <h3>{u.title}</h3>
            <p>{u.body}</p>
            <small>{u.family}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
