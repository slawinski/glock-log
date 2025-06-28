import React from "react";
import { View, TouchableOpacity, Alert } from "react-native";
import { Image } from "expo-image";
import { TerminalText } from "../terminal-text/TerminalText";
import { resolveImageSource } from "../../services/image-source-manager";

interface ImageGalleryProps {
  images: string[];
  onDeleteImage?: (imageIndex: number) => void;
  size?: "small" | "medium" | "large";
  showDeleteButton?: boolean;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  onDeleteImage,
  size = "medium",
  showDeleteButton = false,
}) => {
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

  const handleDeleteImage = (imageIndex: number) => {
    Alert.alert("Delete Image", "Are you sure you want to delete this image?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => onDeleteImage?.(imageIndex),
      },
    ]);
  };

  if (!images || images.length === 0) {
    return (
      <View className="items-center justify-center py-8">
        <TerminalText className="text-terminal-dim">No images</TerminalText>
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
            onError={() => {
              console.error(`Failed to load image: ${imageIdentifier}`);
            }}
          />
          {showDeleteButton && onDeleteImage && (
            <TouchableOpacity
              onPress={() => handleDeleteImage(imageIndex)}
              className="absolute -top-2 -right-2 bg-terminal-error rounded-full w-6 h-6 items-center justify-center"
            >
              <TerminalText className="text-white text-xs">×</TerminalText>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
};
