import React from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import {
  resolveImageSource,
  DEFAULT_FIREARM_PLACEHOLDER_KEY,
} from "../../services/image-source-manager";

interface FirearmImageProps {
  size?: number;
  fill?: boolean;
  className?: string;
  photoUri?: string;
  testID?: string;
}

export const FirearmImage = ({
  size = 120,
  fill = false,
  className = "",
  photoUri,
  testID,
}: FirearmImageProps) => {
  const imageSource = photoUri
    ? resolveImageSource(photoUri)
    : resolveImageSource(`placeholder:${DEFAULT_FIREARM_PLACEHOLDER_KEY}`);

  if (fill) {
    return (
      <View
        className={`justify-center items-center overflow-hidden ${className}`}
        style={{
          width: size,
          height: size,
        }}
        testID={testID}
      >
        <Image
          source={imageSource}
          contentFit="cover"
          cachePolicy="disk"
          style={{
            width: "100%",
            height: "100%",
          }}
          testID={`${testID}-image`}
        />
      </View>
    );
  }

  return (
    <View
      className={`justify-center items-center ${className}`}
      style={{
        width: size,
        height: size,
      }}
      testID={testID}
    >
      <Image
        source={imageSource}
        contentFit="contain"
        cachePolicy="disk"
        style={{
          width: size * 0.9,
          height: size * 0.9,
        }}
        testID={`${testID}-image`}
      />
    </View>
  );
};
