import confetti from "canvas-confetti";

// Muted, warm tones pulled from the paper-planner palette instead of
// neon party colors, so the celebration still feels premium.
const COLORS = ["#4B5A24", "#C9A227", "#8FA37E", "#C7A46B", "#FBF5EA"];

export function burstConfettiFrom(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;

  confetti({
    particleCount: 22,
    spread: 55,
    startVelocity: 28,
    gravity: 1.1,
    scalar: 0.7,
    ticks: 80,
    origin: { x, y },
    colors: COLORS,
    disableForReducedMotion: true,
  });
}

// A bigger single burst - for milestones worth more than the everyday
// checkbox pop (finishing a whole routine, all habits, Work Shutdown).
export function burstConfettiMedium(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;

  confetti({
    particleCount: 60,
    spread: 80,
    startVelocity: 38,
    gravity: 1,
    scalar: 0.9,
    ticks: 130,
    origin: { x, y },
    colors: COLORS,
    disableForReducedMotion: true,
  });
}

// Fireworks-style bursts from both bottom corners for a couple of seconds -
// reserved for genuine milestones (a 7-day streak, etc.), not every task.
export function burstConfettiBig() {
  const end = Date.now() + 1400;
  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 65,
      startVelocity: 45,
      origin: { x: 0, y: 0.7 },
      colors: COLORS,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 65,
      startVelocity: 45,
      origin: { x: 1, y: 0.7 },
      colors: COLORS,
      disableForReducedMotion: true,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
