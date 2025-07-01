import React from "react";
import { Image, View } from "react-native";
import { resolveImageSource } from "../../services/image-source-manager";

interface FirearmImageProps {
  size?: number;
  className?: string;
  photoUri?: string;
  testID?: string;
}

export function FirearmImage({
  size = 120,
  className = "",
  photoUri,
  testID,
}: FirearmImageProps) {
  const imageSource = photoUri
    ? resolveImageSource(photoUri)
    : resolveImageSource("placeholder:pistol-placeholder.png");

  return (
    <View
      className={`justify-center items-center ${className}`}
      // TODO: why not tailwind?
      style={{
        width: size,
        height: size,
      }}
      testID={testID}
    >
      <Image
        source={imageSource}
        resizeMode="contain"
        style={{
          width: size * 0.9,
          height: size * 0.9,
        }}
        testID={`${testID}-image`}
      />
    </View>
  );
}

export default FirearmImage;
