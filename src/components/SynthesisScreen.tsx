import { juiceMeta } from '../game/juice';
import type { Upgrade } from '../game/types';

interface Props {
  wave: number;
  juice: number;
  upgrades: Upgrade[];
  synthKeep: string[];
  synthBurn: string[];
  onKeep: (u: Upgrade) => void;
  onBurn: (u: Upgrade) => void;
  onNextWave: () => void;
}

export function SynthesisScreen({ wave, juice, upgrades, synthKeep, synthBurn, onKeep, onBurn, onNextWave }: Props) {
  return (
    <div>
      <h2>Wave {wave} Synthesis</h2>
      <p>Stabilize for permanence or render for Juice.</p>
      <div>Juice: {juice}</div>
      <div className="grid">
        {upgrades.map((u) => {
          const meta = juiceMeta(u);
          const kept = synthKeep.includes(u.key);
          const burned = synthBurn.includes(u.key);
          return (
            <div className="card" key={u.key}>
              <h3>{u.title}</h3>
              <p>{u.body}</p>
              <div>Keep {meta.cost} / Burn +{meta.gain}</div>
              <button disabled={kept || burned || juice < meta.cost} onClick={() => onKeep(u)}>Stabilize</button>
              <button disabled={kept || burned} onClick={() => onBurn(u)}>Render Juice</button>
            </div>
          );
        })}
      </div>
      <button onClick={onNextWave}>Next Wave</button>
    </div>
  );
}
