import React from "react";
import { TouchableOpacity, Alert } from "react-native";
import { TerminalText } from "../terminal-text/TerminalText";

type Props = {
  onDelete: () => void;
};

export const DeleteButton = ({ onDelete }: Props) => {
  const handleDelete = () => {
    Alert.alert("Delete Image", "Are you sure you want to delete this image?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: onDelete,
      },
    ]);
  };

  return (
    <TouchableOpacity
      testID="delete-icon"
      onPress={handleDelete}
      className="absolute -top-1 -right-1 bg-terminal-green border border-terminal-green w-5 h-5 items-center justify-center"
    >
      <TerminalText className="text-terminal-bg text-xs">X</TerminalText>
    </TouchableOpacity>
  );
};
