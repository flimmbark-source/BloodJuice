import { formatTimer } from '../game/constants';
import type { GameState } from '../game/types';
import { weaponByKey } from '../game/weapons';

export function HUD({ game, onRestart }: { game: GameState; onRestart: () => void }) {
  const hpPct = Math.max(0, Math.min(100, (game.player.hp / Math.max(1, game.player.maxHp)) * 100));
  const xpPct = Math.max(0, Math.min(100, (game.xp / Math.max(1, game.xpTarget)) * 100));
  const lowHp = hpPct <= 25;
  const urgentTimer = game.waveTime <= 10;

  return (
    <div className="hud">
      <div className="hud-top-left">
        <div className="hud-badges">
          <div className="hud-badge">Wave {game.wave}</div>
          <div className="hud-badge">Lv {game.level}</div>
        </div>
        <div className="hud-vitals">
          <div className="hud-bar-row">
            <span className="hud-bar-label hud-bar-label--hp">HP</span>
            <div className={`hud-bar-track hud-bar-hp${lowHp ? ' hud-bar-hp--low' : ''}`}>
              <div className="hud-bar-fill" style={{ width: `${hpPct}%` }} />
            </div>
            <span className="hud-bar-value">{Math.round(game.player.hp)}/{game.player.maxHp}</span>
          </div>
          <div className="hud-bar-row">
            <span className="hud-bar-label hud-bar-label--xp">XP</span>
            <div className="hud-bar-track hud-bar-xp">
              <div className="hud-bar-fill" style={{ width: `${xpPct}%` }} />
            </div>
            <span className="hud-bar-value">{game.xp}/{game.xpTarget}</span>
          </div>
        </div>
      </div>

      <div className="hud-top-center">
        <div className={`hud-timer${urgentTimer ? ' hud-timer--urgent' : ''}`}>
          <span className="hud-timer-label">Wave Ends</span>
          <span className="hud-timer-value">{formatTimer(game.waveTime)}</span>
        </div>
      </div>

      <div className="hud-top-right">
        <div className="hud-badge hud-badge--weapon">
          {game.player.weaponKey ? weaponByKey(game.player.weaponKey).title : 'No Weapon'}
        </div>
        <div className="hud-badge hud-badge--juice">◈ {game.juice}</div>
      </div>

      <div className="hud-bottom-right">
        <span className="hud-hint">WASD / Tap</span>
        <button className="hud-restart" onClick={onRestart}>Restart</button>
      </div>
    </div>
  );
}
