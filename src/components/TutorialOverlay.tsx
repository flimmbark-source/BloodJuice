import { useEffect, useState } from 'react';

interface TutorialOverlayProps {
  step: number;
  onSkip: () => void;
}

const STEPS = [
  {
    title: 'Step 1: Move and kite',
    bodyDesktop: 'Move with WASD or arrow keys, and keep circling enemies instead of face-tanking.',
    bodyMobile: 'Touch and drag on the arena to steer. Keep moving in arcs so enemies do not surround you.',
    target: 'Move your character to continue.',
  },
  {
    title: 'Step 2: Secure your first kill',
    bodyDesktop: 'Your weapon auto-fires toward your aim. Keep enemies in front of your fire lane while dodging.',
    bodyMobile: 'Your weapon auto-fires while you move. Drag to keep enemies in range and avoid getting boxed in.',
    target: 'Defeat 1 enemy to continue.',
  },
  {
    title: 'Step 3: Gain XP and level up',
    bodyDesktop: 'Walk over XP drops to fill the cyan XP bar, then choose an upgrade when level-up appears.',
    bodyMobile: 'Steer through XP drops to fill the cyan XP bar, then tap an upgrade when level-up appears.',
    target: 'Reach your first level-up and pick an upgrade.',
  },
  {
    title: 'Step 4: Use Synthesis between waves',
    bodyDesktop: 'At wave end, use Synthesis to Keep upgrades you want and Burn extras into juice.',
    bodyMobile: 'At wave end, use Synthesis to Keep upgrades you want and Burn extras into juice.',
    target: 'Reach the Synthesis screen to continue.',
  },
  {
    title: 'Step 5: Shop basics - Juice and abilities',
    bodyDesktop: 'In Synthesis, Juice is your currency. Spend it to Stabilize abilities you want to keep, or Burn unwanted ones to gain more Juice.',
    bodyMobile: 'In Synthesis, Juice is your currency. Spend it to Stabilize abilities you want to keep, or Burn unwanted ones to gain more Juice.',
    target: 'Choose what to Stabilize or Burn, then start the next wave to finish the tutorial.',
  },
] as const;

export function TutorialOverlay({ step, onSkip }: TutorialOverlayProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  const current = STEPS[Math.min(step, STEPS.length - 1)];

  return (
    <aside className="tutorial-overlay" aria-live="polite">
      <p className="tutorial-kicker">Progressive Tutorial</p>
      <h3>{current.title}</h3>
      <p>{isMobile ? current.bodyMobile : current.bodyDesktop}</p>
      <p className="tutorial-target">{current.target}</p>
      <div className="tutorial-footer">
        <span>
          {Math.min(step + 1, STEPS.length)} / {STEPS.length}
        </span>
        <button onClick={onSkip}>Skip tutorial</button>
      </div>
    </aside>
  );
}
