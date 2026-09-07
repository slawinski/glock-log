import { View, Pressable } from "react-native";
import { AccessoryStorage } from "../../validation/storageSchemas";
import { TerminalText } from "../../components";
import { ACCESSORY_CATEGORY_LABELS } from "../../utils";

type Props = {
  accessory: AccessoryStorage;
  totalExposure: number;
  currentFirearmName: string | null;
  onPress: (id: string) => void;
};

export const AccessoryListItem = ({
  accessory,
  totalExposure,
  currentFirearmName,
  onPress,
}: Props) => (
  <Pressable
    onPress={() => onPress(accessory.id)}
    className="bg-terminal-bg border-2 border-terminal-border p-4 mb-4"
    style={({ pressed }) => pressed && { opacity: 0.7 }}
    accessibilityRole="button"
    accessibilityLabel={`${accessory.manufacturer ?? ""} ${accessory.modelName}`.trim()}
    testID={`accessory-list-item-${accessory.id}`}
  >
    <TerminalText className="text-terminal-muted text-sm">
      {ACCESSORY_CATEGORY_LABELS[accessory.category].toUpperCase()}
    </TerminalText>
    <TerminalText className="text-lg">
      {[accessory.manufacturer, accessory.modelName].filter(Boolean).join(" ")}
    </TerminalText>
    <View className="flex-row justify-between items-center">
      <TerminalText>{currentFirearmName ?? "NOT MOUNTED"}</TerminalText>
      <TerminalText className="text-terminal-muted">
        {totalExposure.toLocaleString("en-US")} RDS
      </TerminalText>
    </View>
  </Pressable>
);
