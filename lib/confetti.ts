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
