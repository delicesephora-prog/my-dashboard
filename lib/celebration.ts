// Celebration tiers - "small" is the everyday checkbox pop (already
// handled inline by CheckCircle, unchanged). These two are for moments
// that actually deserve more: finishing something whole, or a real streak.

export type CelebrationTier = "medium" | "big";

export type Celebration = {
  tier: CelebrationTier;
  message: string;
};
