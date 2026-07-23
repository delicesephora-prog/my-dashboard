// Vision board: pasted image links (this app has no file/blob storage -
// every other image in the app, like Book covers, is an external URL
// too), each optionally captioned and optionally marked as a "cover" -
// covers rotate daily on the Front Page via coverOfTheDay().
export type VisionImage = {
  id: string;
  url: string;
  caption: string;
  isCover: boolean;
  createdAt: string;
};

export type VisionData = {
  images: VisionImage[];
};

export function emptyVisionData(): VisionData {
  return { images: [] };
}

export function normalizeVisionData(partial: Partial<VisionData> | null | undefined): VisionData {
  const fallback = emptyVisionData();
  if (!partial) return fallback;
  return { images: Array.isArray(partial.images) ? partial.images : fallback.images };
}

export function addVisionImage(
  data: VisionData,
  url: string,
  caption: string,
  now: Date = new Date()
): VisionData {
  const image: VisionImage = {
    id: crypto.randomUUID(),
    url,
    caption,
    isCover: false,
    createdAt: now.toISOString(),
  };
  return { images: [image, ...data.images] };
}

export function updateVisionImage(
  data: VisionData,
  id: string,
  updater: (i: VisionImage) => VisionImage
): VisionData {
  return { images: data.images.map((i) => (i.id === id ? updater(i) : i)) };
}

export function deleteVisionImage(data: VisionData, id: string): VisionData {
  return { images: data.images.filter((i) => i.id !== id) };
}

export function toggleVisionCover(data: VisionData, id: string): VisionData {
  return updateVisionImage(data, id, (i) => ({ ...i, isCover: !i.isCover }));
}

// Deterministic, stable within a calendar day, rotates to the next cover
// image each day - no separate "which day showed what" record needed.
export function coverOfTheDay(data: VisionData, now: Date = new Date()): VisionImage | null {
  const covers = data.images.filter((i) => i.isCover);
  if (covers.length === 0) return null;
  const dayIndex = Math.floor(now.getTime() / 86400000);
  return covers[dayIndex % covers.length];
}
