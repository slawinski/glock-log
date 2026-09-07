import React from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { AccessoryStorage, FirearmType } from "../../validation/storageSchemas";
import { resolveFirearmVisualLayers } from "./firearmVisualResolver";
import { toCurrentMountedAccessoryVisuals } from "./mounts";

type Props = {
  firearmType: FirearmType;
  mountedAccessories: AccessoryStorage[];
  size?: number;
  testID?: string;
};

/**
 * Renders a firearm's derived loadout artwork: the base silhouette plus one
 * layer per mounted accessory. Every asset shares the same square canvas, so
 * stacking them with an absolute fill reproduces the artwork's own alignment —
 * no runtime coordinates, scaling or rotation are computed here.
 */
export const FirearmArtwork = ({
  firearmType,
  mountedAccessories,
  size = 120,
  testID,
}: Props) => {
  const visual = resolveFirearmVisualLayers({
    firearmType,
    accessories: toCurrentMountedAccessoryVisuals(mountedAccessories),
  });

  return (
    <View
      style={{ width: size, height: size }}
      testID={testID}
      accessibilityLabel={`${firearmType} loadout artwork`}
    >
      <Image
        source={visual.base}
        contentFit="contain"
        cachePolicy="disk"
        style={StyleSheet.absoluteFill}
        testID={testID ? `${testID}-base` : undefined}
      />
      {visual.layers.map((layer) => (
        <Image
          key={layer.key}
          source={layer.source}
          contentFit="contain"
          cachePolicy="disk"
          style={StyleSheet.absoluteFill}
          testID={testID ? `${testID}-layer-${layer.visualSlot}` : undefined}
        />
      ))}
    </View>
  );
};
