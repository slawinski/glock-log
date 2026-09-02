import React from "react";
import { View, Pressable } from "react-native";
import { FirearmStorage } from "../../validation/storageSchemas";
import { TerminalText, FirearmImage } from "../../components";
import { formatDate } from "../../utils";

type Props = {
  firearm: FirearmStorage;
  onPress: (firearmId: string) => void;
};

export const FirearmListItem = React.memo(function FirearmListItem({
  firearm,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={() => onPress(firearm.id)}
      className="bg-terminal-bg border-2 border-terminal-border p-4 mb-4"
    >
      <View className="flex-row items-start">
        <FirearmImage
          photoUri={firearm.photos?.[0]}
          size={60}
          className="mr-4"
        />
        <View className="flex-1 flex-row flex-wrap">
          <View className="w-1/2 pr-2">
            <TerminalText className="text-lg" numberOfLines={1}>
              {firearm.modelName} ({firearm.caliber})
            </TerminalText>
          </View>
          <View className="w-1/2 items-end">
            <TerminalText>{firearm.roundsFired} rounds</TerminalText>
          </View>
          <View className="w-1/2 pr-2 mt-1">
            <TerminalText>
              Added: {formatDate(firearm.createdAt)}
            </TerminalText>
          </View>
          <View className="w-1/2 items-end justify-end">
            <TerminalText className="text-lg">{">"}</TerminalText>
          </View>
        </View>
      </View>
    </Pressable>
  );
});
