import { useState } from "react";
import { View, Pressable, LayoutChangeEvent } from "react-native";
import { AccessoryStorage, FirearmStorage } from "../../validation/storageSchemas";
import { TerminalText, FirearmImage } from "../../components";
import { formatDate } from "../../utils";

type Props = {
  firearm: FirearmStorage;
  mountedAccessories: AccessoryStorage[];
  onPress: (firearmId: string) => void;
  showBorrowedBadge?: boolean;
  needsAttention?: boolean;
};

export const FirearmListItem = ({
  firearm,
  mountedAccessories,
  onPress,
  showBorrowedBadge = false,
  needsAttention = false,
}: Props) => {
  const photoUri = firearm.photos?.[0];
  const isBorrowed = firearm.ownership === "borrowed";
  // The photo/artwork fills the card's vertical space, so its square size
  // follows the text column's rendered height (which grows when the name
  // wraps to 2 lines).
  const [imageSize, setImageSize] = useState(80);

  const handleTextLayout = (event: LayoutChangeEvent) => {
    const height = Math.round(event.nativeEvent.layout.height);
    if (height > 0 && height !== imageSize) {
      setImageSize(height);
    }
  };

  return (
    <Pressable
      onPress={() => onPress(firearm.id)}
      className="relative bg-terminal-bg border-2 border-terminal-border p-4 mb-4"
      style={({ pressed }) => pressed && { opacity: 0.7 }}
      accessibilityRole="button"
      accessibilityLabel={`${firearm.modelName} ${firearm.caliber}${
        isBorrowed ? " borrowed" : ""
      }${needsAttention ? ", needs attention" : ""}`}
      testID={`firearm-list-item-${firearm.id}`}
    >
      {needsAttention && (
        <View
          className="absolute top-2 right-2 bg-terminal-green px-1.5 py-0.5"
          testID={`attention-badge-${firearm.id}`}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <TerminalText className="text-sm text-terminal-bg">!</TerminalText>
        </View>
      )}
      <View className="flex-row min-h-[80px]">
        <FirearmImage
          photoUri={photoUri}
          firearmType={firearm.firearmType ?? "other"}
          mountedAccessories={mountedAccessories}
          size={imageSize}
          fill
          className="mr-3 rounded-lg"
        />
        <View className="flex-1" onLayout={handleTextLayout}>
          <View className="flex-row items-center justify-between">
            <TerminalText className="text-lg flex-1" numberOfLines={1}>
              {firearm.modelName}
            </TerminalText>
            {isBorrowed && showBorrowedBadge && (
              <View className="bg-terminal-green px-1.5 py-0.5 ml-2">
                <TerminalText className="text-sm text-terminal-bg">
                  BORROWED
                </TerminalText>
              </View>
            )}
          </View>
          <TerminalText>{firearm.caliber}</TerminalText>
          <TerminalText>{firearm.roundsFired} rounds fired</TerminalText>
          <TerminalText>Added {formatDate(firearm.createdAt)}</TerminalText>
        </View>
      </View>
    </Pressable>
  );
};
