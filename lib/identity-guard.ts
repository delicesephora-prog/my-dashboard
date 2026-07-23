// One-time incident cleanup: an early Becoming onboarding session
// captured the wrong name ("Aisha") into saved state, and it could have
// leaked into the main Assistant's memory too. This list is intentionally
// narrow - not a general content filter - so lib/becoming.ts and
// lib/assistant.ts can strip it on normalize, and lib/db.ts can tell when
// a read needs to write the cleaned copy straight back. Safe to leave in
// permanently: a no-op once the bad data is gone.
export const KNOWN_BAD_IDENTITY_TOKENS = ["aisha"];

export function containsBadIdentityToken(text: string): boolean {
  const lower = text.toLowerCase();
  return KNOWN_BAD_IDENTITY_TOKENS.some((t) => lower.includes(t));
}
