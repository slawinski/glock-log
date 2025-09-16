import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { TerminalText } from "../terminal-text/TerminalText";
import { resolveImageSource } from "../../services/image-source-manager";
import { DeleteButton } from "./DeleteButton";

type Props = {
  images: string[];
  onDeleteImage?: (index: number) => void;
  size?: "small" | "medium" | "large";
  showDeleteButton?: boolean;
  thumbnailIndex?: number;
  onSelectThumbnail?: (index: number) => void;
  allowThumbnailSelection?: boolean;
};

export const ImageGallery = ({
  images,
  onDeleteImage,
  size = "medium",
  showDeleteButton = false,
  thumbnailIndex = 0,
  onSelectThumbnail,
  allowThumbnailSelection = false,
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
      {images.map((imageIdentifier, imageIndex) => {
        const isThumbnail = imageIndex === thumbnailIndex;
        const ImageContainer = allowThumbnailSelection
          ? TouchableOpacity
          : View;

        return (
          <ImageContainer
            key={imageIndex}
            className="relative"
            onPress={
              allowThumbnailSelection
                ? () => onSelectThumbnail?.(imageIndex)
                : undefined
            }
            activeOpacity={allowThumbnailSelection ? 0.7 : 1}
          >
            <Image
              source={resolveImageSource(imageIdentifier)}
              style={{
                width: getImageSize(),
                height: getImageSize(),
                borderRadius: 8,
                borderWidth: isThumbnail ? 3 : 0,
                borderColor: isThumbnail ? "#00ff00" : "transparent",
              }}
              contentFit="cover"
              placeholder="Loading..."
              placeholderContentFit="cover"
              transition={200}
              onError={() => {}}
            />
            {allowThumbnailSelection && !isThumbnail && (
              <View
                style={{
                  position: "absolute",
                  bottom: 4,
                  right: 4,
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  paddingHorizontal: 4,
                  paddingVertical: 2,
                  borderRadius: 4,
                }}
              >
                <TerminalText style={{ fontSize: 8, color: "#00ff00" }}>
                  TAP TO SET
                </TerminalText>
              </View>
            )}
            {showDeleteButton && onDeleteImage && (
              <DeleteButton onDelete={() => onDeleteImage(imageIndex)} />
            )}
          </ImageContainer>
        );
      })}
    </View>
  );
};
