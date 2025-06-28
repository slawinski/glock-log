export const placeholderImages = {
  "pistol-placeholder.png": require("../../assets/images/pistol-placeholder.png"),
  "revolver-placeholder.png": require("../../assets/images/revolver-placeholder.png"),
  "shotgun-placeholder.png": require("../../assets/images/shotgun-placeholder.png"),
  "carbine-placeholder.png": require("../../assets/images/carbine-placeholder.png"),
  "pcc-placeholder.png": require("../../assets/images/pcc-placeholder.png"),
};

export type PlaceholderImageKey = keyof typeof placeholderImages;

export const resolveImageSource = (imageIdentifier: string) => {
  if (imageIdentifier.startsWith("placeholder:")) {
    const key = imageIdentifier.replace(
      "placeholder:",
      ""
    ) as PlaceholderImageKey;
    if (key in placeholderImages) {
      return placeholderImages[key];
    }
  }
  return { uri: imageIdentifier };
};
