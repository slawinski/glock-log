import React from "react";
import { View, TouchableOpacity, Image, FlatList } from "react-native";
import { TerminalText } from "../terminal-text/TerminalText";
import {
  placeholderImages,
  PlaceholderImageKey,
} from "../../services/image-source-manager";

interface PlaceholderImagePickerProps {
  onSelect: (key: PlaceholderImageKey) => void;
}

export const PlaceholderImagePicker: React.FC<PlaceholderImagePickerProps> = ({
  onSelect,
}) => {
  const imageKeys = Object.keys(placeholderImages) as PlaceholderImageKey[];

  return (
    <View>
      <TerminalText className="mb-2">CHOOSE A PLACEHOLDER</TerminalText>
      <FlatList
        data={imageKeys}
        horizontal
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => onSelect(item)} className="mr-2">
            <Image
              source={placeholderImages[item]}
              className="w-24 h-24 border border-terminal-border"
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
      />
    </View>
  );
};
