import React from "react";
import { Image, View } from "react-native";

interface FirearmImageProps {
  size?: number;
  className?: string;
  photoUri?: string;
  testID?: string;
}

export default function FirearmImage({
  size = 120,
  className = "",
  photoUri,
  testID,
}: FirearmImageProps) {
  return (
    <View
      className={`justify-center items-center bg-black ${className}`}
      // TODO: why not tailwind?
      style={{
        width: size,
        height: size,
      }}
      testID={testID}
    >
      <Image
        source={
          photoUri
            ? { uri: photoUri }
            : require("../../../assets/images/pistol-placeholder.png")
        }
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
