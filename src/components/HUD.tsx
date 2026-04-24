import { formatTimer } from '../game/constants';
import type { GameState } from '../game/types';
import { weaponByKey } from '../game/weapons';

export function HUD({ game, onRestart }: { game: GameState; onRestart: () => void }) {
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
        <div>HP: {Math.round(game.player.hp)}/{game.player.maxHp}</div>
        <div>XP: {game.xp}/{game.xpTarget}</div>
        <div>Move: WASD / Tap</div>
        <button onClick={onRestart}>Restart</button>
      </div>
    </>
  );
}
