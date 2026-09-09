import React from "react";
import { View, Pressable } from "react-native";
import { AccessoryStorage } from "../../validation/storageSchemas";
import { AccessoryImage, TerminalText } from "../../components";
import { ACCESSORY_CATEGORY_LABELS } from "../../utils";

type Props = {
  accessory: AccessoryStorage;
  totalExposure: number;
  currentFirearmName: string | null;
  onPress: (id: string) => void;
};

const AccessoryListItemComponent = ({
  accessory,
  totalExposure,
  currentFirearmName,
  onPress,
}: Props) => (
  <Pressable
    onPress={() => onPress(accessory.id)}
    className="bg-terminal-bg border-2 border-terminal-border p-4 mb-4 active:opacity-70"
    accessibilityRole="button"
    accessibilityLabel={`${accessory.manufacturer ?? ""} ${accessory.modelName}`.trim()}
    testID={`accessory-list-item-${accessory.id}`}
  >
    <View className="flex-row min-h-[80px]">
      <AccessoryImage
        category={accessory.category}
        photoUri={accessory.photos?.[0]}
        size={80}
        fill
        className="mr-3 rounded-lg"
        testID={`accessory-image-${accessory.id}`}
      />
      <View className="flex-1">
        <TerminalText className="text-terminal-muted text-sm">
          {ACCESSORY_CATEGORY_LABELS[accessory.category].toUpperCase()}
        </TerminalText>
        <TerminalText className="text-lg">
          {[accessory.manufacturer, accessory.modelName].filter(Boolean).join(" ")}
        </TerminalText>
        <View className="flex-row flex-wrap justify-between items-center gap-x-2">
          <TerminalText className="flex-shrink">
            {currentFirearmName ?? "NOT MOUNTED"}
          </TerminalText>
          <TerminalText className="text-terminal-muted">
            {totalExposure.toLocaleString("en-US")} RDS
          </TerminalText>
        </View>
      </View>
    </View>
  </Pressable>
);

export const AccessoryListItem = React.memo(AccessoryListItemComponent);
