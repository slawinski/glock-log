import React from "react";
import { View, TouchableOpacity, Image, FlatList } from "react-native";
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
          <TouchableOpacity
            testID={`placeholder-image-option-${item}`}
            onPress={() => onSelect(item)}
            className="mr-2"
          >
            <Image
              testID={`placeholder-image-${item}`}
              source={placeholderImages[item]}
              className={`w-24 h-24 border ${selectedImageKey === item ? "border-terminal-green" : "border-terminal-border"}`}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
      />
    </View>
  );
};
