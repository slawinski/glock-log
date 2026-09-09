import React from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { resolveImageSource } from "../../services/image-source-manager";
import { AccessoryCategory } from "../../validation/storageSchemas";
import { ACCESSORY_IMAGE_ASSETS } from "./accessoryImageAssets";

type Props = {
  category: AccessoryCategory;
  photoUri?: string;
  size?: number;
  fill?: boolean;
  className?: string;
  testID?: string;
};

export const AccessoryImage = ({
  category,
  photoUri,
  size = 120,
  fill = false,
  className = "",
  testID,
}: Props) => {
  const source = photoUri
    ? resolveImageSource(photoUri)
    : ACCESSORY_IMAGE_ASSETS[category];
  const cover = Boolean(photoUri) && fill;
  const imageSize = cover ? size : size * 0.9;

  return (
    <View
      className={`justify-center items-center overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      testID={testID}
    >
      <Image
        source={source}
        contentFit={cover ? "cover" : "contain"}
        cachePolicy="disk"
        style={{ width: imageSize, height: imageSize }}
        testID={testID ? `${testID}-image` : undefined}
      />
    </View>
  );
};
