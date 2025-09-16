import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Dimensions } from "react-native";
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
    <View style={{ gap: 8 }}>
      {rows.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={{
            flexDirection: "row",
            gap: 8,
            justifyContent: "flex-start",
          }}
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
                style={{
                  position: "relative",
                  width: imageSize,
                  height: imageSize,
                }}
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
                    width: imageSize,
                    height: imageSize,
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
      ))}
    </View>
  );
};
