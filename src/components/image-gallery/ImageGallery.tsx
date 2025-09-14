import React from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { TerminalText } from "../terminal-text/TerminalText";
import { resolveImageSource } from "../../services/image-source-manager";
import { DeleteButton } from "./DeleteButton";

type Props = {
  images: string[];
  onDeleteImage?: (index: number) => void;
  size?: "small" | "medium" | "large";
  showDeleteButton?: boolean;
};

export const ImageGallery = ({
  images,
  onDeleteImage,
  size = "medium",
  showDeleteButton = false,
}: Props) => {
  const getImageSize = () => {
    switch (size) {
      case "small":
        return 80;
      case "large":
        return 200;
      default:
        return 120;
    }
  };


  if (!images || images.length === 0) {
    return (
      <View className="items-center justify-center py-8">
        <TerminalText>No images</TerminalText>
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap gap-2">
      {images.map((imageIdentifier, imageIndex) => (
        <View key={imageIndex} className="relative">
          <Image
            source={resolveImageSource(imageIdentifier)}
            style={{
              width: getImageSize(),
              height: getImageSize(),
              borderRadius: 8,
            }}
            contentFit="cover"
            placeholder="Loading..."
            placeholderContentFit="cover"
            transition={200}
            onError={() => {}}
          />
          {showDeleteButton && onDeleteImage && (
            <DeleteButton onDelete={() => onDeleteImage(imageIndex)} />
          )}
        </View>
      ))}
    </View>
  );
};
