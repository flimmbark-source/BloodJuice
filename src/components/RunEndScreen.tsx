import type { GameState } from '../game/types';

export function RunEndScreen({ game, onRestart }: { game: GameState; onRestart: () => void }) {
  const lastMessage = game.messages[game.messages.length - 1];
  return (
    <div>
      <h2>{game.phase === 'won' ? 'Victory' : 'Run Over'}</h2>
      <p>{lastMessage}</p>
      <p>
        Wave {game.wave} · Level {game.level} · {game.kills} kills
      </p>
      <button onClick={onRestart}>Restart</button>
    </div>
  );
}
