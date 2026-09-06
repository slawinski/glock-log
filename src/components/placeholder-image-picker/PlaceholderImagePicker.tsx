import React from "react";
import { View, Pressable, FlatList } from "react-native";
import { Image } from "expo-image";
import { TerminalText } from "../terminal-text/TerminalText";

type Props = {
  images: Record<string, number>;
  onSelect: (key: string) => void;
  selectedImageKey?: string;
};

export const PlaceholderImagePicker = ({
  images,
  onSelect,
  selectedImageKey,
}: Props) => {
  const imageKeys = Object.keys(images);

  return (
    <View>
      <TerminalText className="mb-2">CHOOSE A PLACEHOLDER</TerminalText>
      <FlatList
        data={imageKeys}
        horizontal
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <Pressable
            testID={`placeholder-image-option-${item}`}
            onPress={() => onSelect(item)}
            className="mr-2"
            accessibilityRole="button"
            accessibilityLabel={`Select ${item.replace(/\.(png|jpg|jpeg|webp)$/i, "")} placeholder image`}
            accessibilityState={{
              selected: selectedImageKey === item,
            }}
          >
            <Image
              testID={`placeholder-image-${item}`}
              source={images[item]}
              className={`border-2 ${selectedImageKey === item ? "border-terminal-green" : "border-terminal-border"}`}
              style={{ width: 96, height: 96 }}
              contentFit="contain"
            />
          </Pressable>
        )}
      />
    </View>
  );
};
