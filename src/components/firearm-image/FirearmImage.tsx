import React from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { resolveImageSource } from "../../services/image-source-manager";
import { FirearmArtwork } from "../../features/firearm-visuals";
import { AccessoryStorage, FirearmType } from "../../validation/storageSchemas";

interface FirearmImageProps {
  size?: number;
  fill?: boolean;
  className?: string;
  photoUri?: string;
  testID?: string;
  firearmType?: FirearmType;
  mountedAccessories?: AccessoryStorage[];
}

export const FirearmImage = ({
  size = 120,
  fill = false,
  className = "",
  photoUri,
  testID,
  firearmType,
  mountedAccessories = [],
}: FirearmImageProps) => {
  // No user cover photo → derived loadout artwork (firearm types only). Real
  // photos (firearm or ammunition) keep the original photo rendering path.
  if (!photoUri) {
    return (
      <View
        className={`justify-center items-center ${className}`}
        style={{ width: size, height: size }}
        testID={testID}
      >
        <FirearmArtwork
          firearmType={firearmType ?? "other"}
          mountedAccessories={mountedAccessories}
          size={size * 0.9}
          testID={testID ? `${testID}-artwork` : undefined}
        />
      </View>
    );
  }

  const imageSource = resolveImageSource(photoUri);

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
