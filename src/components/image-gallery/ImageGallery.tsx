import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Dimensions } from "react-native";
import { Image } from "expo-image";
import { TerminalText } from "../terminal-text/TerminalText";
import { resolveImageSource } from "../../services/image-source-manager";
import { DeleteButton } from "./DeleteButton";

type Props = {
  images: string[];
  onDeleteImage?: (_imageIndex: number) => void;
  size?: "small" | "medium" | "large";
  showDeleteButton?: boolean;
  thumbnailIndex?: number;
  onSelectThumbnail?: (_index: number) => void;
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
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get("window").width
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setScreenWidth(window.width);
    });

    return () => subscription?.remove();
  }, []);

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

  const getResponsiveImageSize = () => {
    const baseSize = getImageSize();
    const padding = 16; // Account for container padding
    const gap = 8; // Gap between images
    const availableWidth = screenWidth - padding * 2;

    // Calculate how many columns can fit
    let columns = Math.floor((availableWidth + gap) / (baseSize + gap));
    columns = Math.max(2, Math.min(columns, 4)); // Between 2-4 columns

    // Calculate actual image size to fit exactly
    const imageSize = Math.floor(
      (availableWidth - gap * (columns - 1)) / columns
    );

    return { imageSize, columns };
  };

  const { imageSize, columns } = getResponsiveImageSize();

  if (!images || images.length === 0) {
    return (
      <View className="items-center justify-center py-8">
        <TerminalText>No images</TerminalText>
      </View>
    );
  }

  // Group images into rows
  const rows = [];
  for (let i = 0; i < images.length; i += columns) {
    rows.push(images.slice(i, i + columns));
  }

  return (
    <View className="gap-2">
      {rows.map((row, rowIndex) => (
        <View
          key={rowIndex}
          className="flex-row gap-2 justify-start"
        >
          {row.map((imageIdentifier, colIndex) => {
            const imageIndex = rowIndex * columns + colIndex;
            const isThumbnail =
              allowThumbnailSelection && imageIndex === thumbnailIndex;
            const ImageContainer = allowThumbnailSelection
              ? TouchableOpacity
              : View;

            return (
              <ImageContainer
                key={imageIndex}
                testID="gallery-image"
                className="relative"
                style={{ width: imageSize, height: imageSize }}
                onPress={
                  allowThumbnailSelection
                    ? () => onSelectThumbnail?.(imageIndex)
                    : undefined
                }
                activeOpacity={allowThumbnailSelection ? 0.7 : 1}
              >
                <Image
                  source={resolveImageSource(imageIdentifier)}
                  className={`w-full h-full rounded-lg ${isThumbnail ? "border-4 border-terminal-green" : ""}`}
                  contentFit="cover"
                  placeholder="Loading..."
                  placeholderContentFit="cover"
                  transition={200}
                  onError={() => {}}
                />
                {allowThumbnailSelection && !isThumbnail && (
                  <View className="absolute bottom-1 right-1 bg-black/60 px-1 py-0.5 rounded">
                    <TerminalText className="text-xs text-terminal-green">
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
      ))}
    </View>
  );
};