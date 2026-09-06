import * as FileSystem from "expo-file-system";

export const placeholderImages = {
  "pistol-placeholder.png": require("../../assets/images/pistol-placeholder.png"),
  "revolver-placeholder.png": require("../../assets/images/revolver-placeholder.png"),
  "shotgun-placeholder.png": require("../../assets/images/shotgun-placeholder.png"),
  "carbine-placeholder.png": require("../../assets/images/carbine-placeholder.png"),
  "pcc-placeholder.png": require("../../assets/images/pcc-placeholder.png"),
};

export type PlaceholderImageKey = keyof typeof placeholderImages;

export const ammunitionPlaceholderImages = {
  "22-placeholder.png": require("../../assets/images/22-placeholder.png"),
  "357-placeholder.png": require("../../assets/images/357-placeholder.png"),
  "9mm-placeholder.png": require("../../assets/images/9mm-placeholder.png"),
  "45-placeholder.png": require("../../assets/images/45-placeholder.png"),
  "556-placeholder.png": require("../../assets/images/556-placeholder.png"),
  "shell-placeholder.png": require("../../assets/images/shell-placeholder.png"),
};

export type AmmunitionPlaceholderImageKey = keyof typeof ammunitionPlaceholderImages;

const allPlaceholderImages = {
  ...placeholderImages,
  ...ammunitionPlaceholderImages,
};

/**
 * Normalizes an image path to ensure it points to the current app's document directory.
 * This is necessary because iOS app container UUIDs change on every installation/restore.
 */
export const normalizeImagePath = (path: string): string => {
  if (!path || path.startsWith("placeholder:") || path.startsWith("http")) {
    return path;
  }

  // If the path contains 'images/', extract the filename and prepend the current document directory
  const imagesIndex = path.lastIndexOf("images/");
  if (imagesIndex !== -1) {
    const filename = path.substring(imagesIndex); // e.g., "images/firearm_123.jpg"
    return `${FileSystem.documentDirectory}${filename}`;
  }

  return path;
};

export const resolveImageSource = (imageIdentifier: string) => {
  if (imageIdentifier.startsWith("placeholder:")) {
    const key = imageIdentifier.replace("placeholder:", "");
    if (key in allPlaceholderImages) {
      return allPlaceholderImages[key as keyof typeof allPlaceholderImages];
    }
  }

  // Normalize path for locally stored images
  const normalizedPath = normalizeImagePath(imageIdentifier);
  return { uri: normalizedPath };
};
