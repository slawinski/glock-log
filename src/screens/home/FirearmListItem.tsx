import { View, Pressable } from "react-native";
import { FirearmStorage } from "../../validation/storageSchemas";
import { TerminalText, FirearmImage } from "../../components";
import { formatDate } from "../../utils";

type Props = {
  firearm: FirearmStorage;
  onPress: (firearmId: string) => void;
};

export const FirearmListItem = ({ firearm, onPress }: Props) => {
  const photoUri = firearm.photos?.[0];

  return (
    <Pressable
      onPress={() => onPress(firearm.id)}
      className="bg-terminal-bg border-2 border-terminal-border p-4 mb-4"
      style={({ pressed }) => pressed && { opacity: 0.7 }}
      accessibilityRole="button"
      accessibilityLabel={`${firearm.modelName} ${firearm.caliber}`}
      testID={`firearm-list-item-${firearm.id}`}
    >
      <View
        className={`flex-row ${
          photoUri ? "min-h-[80px]" : "min-h-[72px]"
        }`}
      >
        {photoUri && (
          <FirearmImage
            photoUri={photoUri}
            fill
            className="mr-3 rounded-lg"
          />
        )}
        <View className="flex-1">
          <TerminalText className="text-lg" numberOfLines={2}>
            {firearm.modelName}
          </TerminalText>
          <TerminalText>{firearm.caliber}</TerminalText>
          <TerminalText>{firearm.roundsFired} rounds fired</TerminalText>
          <TerminalText>Added {formatDate(firearm.createdAt)}</TerminalText>
        </View>
      </View>
    </Pressable>
  );
};
