"use client";

import { useEffect } from "react";
import { Celebration } from "@/lib/celebration";
import { burstConfettiBig } from "@/lib/confetti";
import { playPopSound } from "@/lib/pop-sound";

export default function CelebrationOverlay({
  celebration,
  onDismiss,
}: {
  celebration: Celebration | null;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!celebration) return;
    if (celebration.tier === "big") {
      burstConfettiBig();
      playPopSound();
      const timer = setTimeout(onDismiss, 4000);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(onDismiss, 2600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebration]);

  if (!celebration) return null;

  if (celebration.tier === "big") {
    return (
      <div
        onClick={onDismiss}
        className="fixed inset-0 z-[90] flex cursor-pointer flex-col items-center justify-center bg-work/95 px-8 text-center animate-fade-in"
      >
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.3em] text-gold">Milestone</p>
        <p className="mt-4 font-serif text-[1.6rem] leading-snug text-paper-surface">
          {celebration.message}
        </p>
        <p className="mt-8 text-[10.5px] uppercase tracking-[0.16em] text-paper-surface/60">
          Tap anywhere to continue
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 top-0 z-[90] flex justify-center px-5 pt-[calc(env(safe-area-inset-top)+10px)]">
      <div className="animate-fade-in rounded-full bg-work px-5 py-3 shadow-paper-lg">
        <p className="text-[13px] font-medium text-paper-surface">{celebration.message}</p>
      </div>
    </div>
  );
}
