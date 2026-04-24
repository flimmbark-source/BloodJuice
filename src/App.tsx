import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { Modal } from './components/Modal';
import { RunEndScreen } from './components/RunEndScreen';
import { SynthesisScreen } from './components/SynthesisScreen';
import { UpgradeSelect } from './components/UpgradeSelect';
import { WeaponSelect } from './components/WeaponSelect';
import { initGame } from './game/initialState';
import { selfCheck } from './game/selfCheck';
import { synthBurn, synthKeep, chooseUpgrade, prepareWaveEndToSynthesis, stepGame } from './game/simulation';
import { upgradeByKey } from './game/upgrades';
import { beginNextWave } from './game/wave';
import { setArenaFromViewport, waveLen } from './game/constants';
import { weaponByKey } from './game/weapons';
import { useGameLoop } from './hooks/useGameLoop';
import { useKeyboard } from './hooks/useKeyboard';
import { useTapMove } from './hooks/useTapMove';
import type { Upgrade } from './game/types';

export default function App() {
  const [game, setGame] = useState(() => {
    setArenaFromViewport(window.innerWidth, window.innerHeight);
    return initGame();
  });
  const [, setViewportTick] = useState(0);
  const keysRef = useKeyboard();
  const { tapMoveRef, setTapTarget, clearTapTarget } = useTapMove();
  const shotCooldownRef = useRef(0);

  useEffect(() => {
    selfCheck();
  }, []);

  const handleCanvasResize = useCallback((width: number, height: number): void => {
    setArenaFromViewport(width, height);
    setViewportTick((tick) => tick + 1);
  }, []);

  useEffect(() => {
    if (game.phase !== 'waveEnd') return;
    const id = window.setTimeout(() => setGame((g) => prepareWaveEndToSynthesis(g)), 900);
    return () => window.clearTimeout(id);
  }, [game.phase]);

  useGameLoop((dt) => {
    setGame((prev) => {
      const stepped = stepGame(prev, keysRef.current, tapMoveRef.current, dt, shotCooldownRef.current);
      shotCooldownRef.current = stepped.shotCooldown;
      return stepped.state;
    });
  });

  const waveUpgrades = useMemo(() => game.wavePicks.map((k) => upgradeByKey(k)).filter(Boolean), [game.wavePicks]);

  const chooseWeapon = (key: string): void => {
    setGame((prev) => {
      if (prev.phase !== 'start') return prev;
      const out = weaponByKey(key).apply(prev.player, prev.systems);
      shotCooldownRef.current = 0;
      return { ...prev, phase: 'playing', player: out.player, systems: out.systems, waveTime: waveLen(prev.wave), messages: [out.message] };
    });
  };

  const restart = (): void => {
    shotCooldownRef.current = 0;
    setGame(initGame());
  };

  return (
    <div className="app">
      <div className="stage">
        <GameCanvas game={game} onTapMove={setTapTarget} onTapEnd={clearTapTarget} onSizeChange={handleCanvasResize} />
        <HUD game={game} onRestart={restart} />

        {game.phase === 'start' && (
          <Modal>
            <WeaponSelect onChoose={chooseWeapon} />
          </Modal>
        )}

        {game.phase === 'levelup' && (
          <Modal>
            <UpgradeSelect upgrades={game.offered} onChoose={(u) => setGame((g) => chooseUpgrade(g, u))} />
          </Modal>
        )}

        {game.phase === 'synthesis' && (
          <Modal>
            <SynthesisScreen
              wave={game.wave}
              juice={game.juice}
              upgrades={waveUpgrades as Upgrade[]}
              synthKeep={game.synthKeep}
              synthBurn={game.synthBurn}
              onKeep={(u) => setGame((g) => synthKeep(g, u))}
              onBurn={(u) => setGame((g) => synthBurn(g, u))}
              onNextWave={() => setGame((g) => beginNextWave(g))}
            />
          </Modal>
        )}

        {(game.phase === 'dead' || game.phase === 'won') && (
          <Modal>
            <RunEndScreen game={game} onRestart={restart} />
          </Modal>
        )}
      </div>
    </div>
  );
}
