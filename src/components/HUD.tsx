import { formatTimer } from '../game/constants';
import type { GameState } from '../game/types';
import { weaponByKey } from '../game/weapons';

export function HUD({ game, onRestart }: { game: GameState; onRestart: () => void }) {
  const hpPct = Math.max(0, Math.min(100, (game.player.hp / Math.max(1, game.player.maxHp)) * 100));
  const xpPct = Math.max(0, Math.min(100, (game.xp / Math.max(1, game.xpTarget)) * 100));

  return (
    <>
      <div className="hud-row">
        <div>Wave {game.wave}</div>
        <div>Lv {game.level}</div>
        <div>{game.player.weaponKey ? weaponByKey(game.player.weaponKey).title : 'No Weapon'}</div>
        <div>Juice {game.juice}</div>
      </div>
      <div className="timer-card">
        <div>Wave Ends</div>
        <strong>{formatTimer(game.waveTime)}</strong>
      </div>
      <div className="status">
        <div className="status-meters">
          <div className="status-meter">
            <div className="status-meter-label">HP {Math.round(game.player.hp)}/{game.player.maxHp}</div>
            <div className="status-meter-track hp">
              <div className="status-meter-fill" style={{ width: `${hpPct}%` }} />
            </div>
          </div>
          <div className="status-meter">
            <div className="status-meter-label">XP {game.xp}/{game.xpTarget}</div>
            <div className="status-meter-track xp">
              <div className="status-meter-fill" style={{ width: `${xpPct}%` }} />
            </div>
          </div>
        </div>
        <div>Move: WASD / Tap</div>
        <button onClick={onRestart}>Restart</button>
      </div>
    </>
  );
}
