import { FirearmType } from "../../validation/storageSchemas";

/**
 * Maps legacy stored placeholder identifiers to a firearm type. Only the
 * firearm archetype is inferred — never accessory mount state. A red-dot
 * placeholder implies "pistol", NOT "a red dot is mounted".
 */
const LEGACY_PLACEHOLDER_TO_TYPE: Record<string, FirearmType> = {
  "pistol-placeholder.png": "pistol",
  "pistol-reddot-placeholder.png": "pistol",
  "revolver-placeholder.png": "revolver",
  "pcc-placeholder.png": "pcc",
  "carbine-placeholder.png": "rifle",
  "shotgun-placeholder.png": "shotgun",
};

export const isPlaceholderPhoto = (photo: string): boolean =>
  photo.startsWith("placeholder:");

export const stripPlaceholderPhotos = (photos: string[] | undefined): string[] =>
  (photos ?? []).filter((photo) => !isPlaceholderPhoto(photo));

/**
 * Infers a firearm type from legacy placeholder photo entries, or returns
 * `null` when nothing is recognized. Never infers from model names.
 */
export const inferLegacyFirearmType = (
  photos: string[] | undefined
): FirearmType | null => {
  if (!photos) return null;
  for (const photo of photos) {
    if (!isPlaceholderPhoto(photo)) continue;
    const key = photo.slice("placeholder:".length);
    const type = LEGACY_PLACEHOLDER_TO_TYPE[key];
    if (type) return type;
  }
  return null;
};
