"use client";

import { useEffect, useState } from "react";
import localFont from "next/font/local";
import { greetingForHour, formatElegantDate } from "@/lib/date";
import { verseForDate, factForDate } from "@/lib/welcome";

// Self-hosted, loaded only where this component is used - not sitewide -
// so the rest of the app keeps its system-font-only footprint. Both are
// OFL-licensed (see app/fonts/*-OFL.txt).
const displaySerif = localFont({ src: "../app/fonts/Italiana-Regular.ttf", display: "swap" });
const italicSerif = localFont({ src: "../app/fonts/Lora-Italic.ttf", display: "swap" });

export default function WelcomeScreen({ onDone }: { onDone: () => void }) {
  const [now] = useState(() => new Date());
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLeaving(true), 6500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(onDone, 900);
    return () => clearTimeout(timer);
  }, [leaving, onDone]);

  const verse = verseForDate(now);
  const fact = factForDate(now);

  return (
    <div
      onClick={() => setLeaving(true)}
      className={`fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center px-8 text-center transition-all duration-[900ms] ease-out ${
        leaving ? "-translate-y-4 scale-[0.98] opacity-0" : "translate-y-0 scale-100 opacity-100"
      }`}
      style={{
        background:
          "radial-gradient(circle at 50% 12%, rgba(176,139,79,0.10), transparent 55%), #F7F2EA",
      }}
    >
      <WelcomeStage delay={100}>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-gold">
          {greetingForHour(now.getHours())}
        </p>
      </WelcomeStage>
      <WelcomeStage delay={320}>
        <p className={`${displaySerif.className} text-[46px] leading-[1.05] text-paper-ink`}>Sephora</p>
      </WelcomeStage>
      <WelcomeStage delay={520}>
        <p className={`${italicSerif.className} mb-9 mt-2.5 text-[14px] text-paper-muted`}>
          {formatElegantDate(now)}
        </p>
      </WelcomeStage>

      <WelcomeStage delay={850}>
        <div className="mx-auto mb-5 h-px w-8 bg-gradient-to-r from-transparent via-gold to-transparent" />
      </WelcomeStage>
      <WelcomeStage delay={1000}>
        <p className={`${italicSerif.className} max-w-xs text-[20px] leading-[1.6] text-paper-ink`}>
          &ldquo;{verse.verse}&rdquo;
        </p>
      </WelcomeStage>
      <WelcomeStage delay={1250}>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
          {verse.reference}
        </p>
      </WelcomeStage>

      <WelcomeStage delay={1500}>
        <div className={`${italicSerif.className} mt-8 max-w-xs border-y border-gold-soft px-5 py-4 text-[12.5px] leading-[1.65] text-paper-muted`}>
          {verse.encouragement}
        </div>
      </WelcomeStage>

      <WelcomeStage delay={1750}>
        <p className="mt-6 max-w-[240px] text-[10.5px] leading-snug text-paper-faint">
          Fact of the day: {fact.fact}
        </p>
      </WelcomeStage>

      <div
        className="absolute bottom-7 left-0 right-0 text-center text-[10px] uppercase tracking-[0.16em] text-paper-faint transition-opacity duration-700"
        style={{ animation: leaving ? "none" : "welcomePulse 2.6s ease-in-out 2s infinite" }}
      >
        Tap anywhere to continue
      </div>
      <style jsx>{`
        @keyframes welcomePulse {
          0%,
          100% {
            opacity: 0.55;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

function WelcomeStage({ delay, children }: { delay: number; children: React.ReactNode }) {
  return (
    <div
      className="opacity-0"
      style={{
        animation: `welcomeIn 900ms cubic-bezier(.2,.7,.3,1) forwards`,
        animationDelay: `${delay}ms`,
      }}
    >
      {children}
      <style jsx>{`
        @keyframes welcomeIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
          from {
            opacity: 0;
            transform: translateY(10px);
          }
        }
      `}</style>
    </div>
  );
}
