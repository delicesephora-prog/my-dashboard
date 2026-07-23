import localFont from "next/font/local";

// Same self-hosted display face as WelcomeScreen's once-a-day splash -
// loading it here too (Next dedupes identical localFont calls at build
// time) gives the app a small, permanent signature instead of only a
// once-a-day one.
const displaySerif = localFont({ src: "../app/fonts/Italiana-Regular.ttf", display: "swap" });

export default function Monogram() {
  return (
    <span
      className={`${displaySerif.className} select-none text-[1.05rem] leading-none text-gold`}
      aria-hidden="true"
    >
      S
    </span>
  );
}
