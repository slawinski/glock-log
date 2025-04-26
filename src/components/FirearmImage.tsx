import React from "react";
import { Image, View, ImageSourcePropType } from "react-native";

interface FirearmImageProps {
  size?: number;
  className?: string;
}

export default function FirearmImage({
  size = 120,
  className = "",
}: FirearmImageProps) {
  return (
    <View
      className={`justify-center items-center bg-black ${className}`}
      style={{
        width: size,
        height: size,
      }}
    >
      <Image
        source={require("../../assets/images/glock-placeholder.png")}
        style={{
          width: size * 0.9,
          height: size * 0.9,
          resizeMode: "contain",
        }}
      />
    </View>
  );
}
