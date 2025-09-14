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
      onPress={handleDelete}
      className="absolute -top-2 -right-2 bg-terminal-error rounded-full w-6 h-6 items-center justify-center"
    >
      <TerminalText className="text-white text-xs">×</TerminalText>
    </TouchableOpacity>
  );
};