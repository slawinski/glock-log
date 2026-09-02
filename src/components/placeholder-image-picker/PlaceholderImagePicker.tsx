import React from "react";
import { View, Pressable, Image, FlatList } from "react-native";
import { TerminalText } from "../terminal-text/TerminalText";
import {
  placeholderImages,
  PlaceholderImageKey,
} from "../../services/image-source-manager";

type Props = {
  onSelect: (key: PlaceholderImageKey) => void;
  selectedImageKey?: PlaceholderImageKey;
};

export const PlaceholderImagePicker = ({
  onSelect,
  selectedImageKey,
}: Props) => {
  const imageKeys = Object.keys(placeholderImages) as PlaceholderImageKey[];

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
              source={placeholderImages[item]}
              className={`w-24 h-24 border-2 ${selectedImageKey === item ? "border-terminal-green" : "border-terminal-border"}`}
              resizeMode="contain"
            />
          </Pressable>
        )}
      />
    </View>
  );
};
