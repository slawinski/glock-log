import React, { FC, PropsWithChildren } from "react";
import { View, TouchableOpacity, Alert } from "react-native";
import { TerminalText, TerminalInput } from "../";
import { AmmunitionStorage } from "../../validation/storageSchemas";

type Firearm = {
  id: string;
  modelName: string;
  caliber: string;
};

type AmmunitionUsed = {
  [key: string]: { ammunitionId?: string; rounds: number | null };
};

type FirearmsUsedInputProps = {
  firearms: Firearm[];
  ammunition: AmmunitionStorage[];
  selectedFirearms: string[];
  ammunitionUsed: AmmunitionUsed;
  onToggleFirearm: (firearmId: string) => void;
  onRoundsChange: (firearmId: string, rounds: number | null) => void;
  onAmmunitionSelect: (firearmId: string, ammunitionId: string) => void;
  onAddBorrowedAmmunition: () => void;
  onRemoveBorrowedAmmunition: (key: string) => void;
  onBorrowedAmmunitionRoundsChange: (key: string, rounds: number | null) => void;
};

export const FirearmsUsedInput: FC<
  PropsWithChildren<FirearmsUsedInputProps>
> = ({
  firearms,
  ammunition,
  selectedFirearms,
  ammunitionUsed,
  onToggleFirearm,
  onRoundsChange,
  onAmmunitionSelect,
  onAddBorrowedAmmunition,
  onRemoveBorrowedAmmunition,
  onBorrowedAmmunitionRoundsChange,
}) => {
  return (
    <View>
      <View className="mb-4">
        <TerminalText>FIREARMS USED</TerminalText>
        {firearms.map((firearm) => (
          <View key={firearm.id} className="mb-2">
            <TouchableOpacity
              onPress={() => onToggleFirearm(firearm.id)}
              className={`border-2 p-2 ${
                selectedFirearms.includes(firearm.id)
                  ? "border-terminal-accent"
                  : "border-terminal-border"
              }`}
            >
              <TerminalText>{firearm.modelName}</TerminalText>
            </TouchableOpacity>
            {selectedFirearms.includes(firearm.id) && (
              <View className="mt-2">
                <TerminalText>AMMUNITION USED</TerminalText>
                <View className="flex-row items-center">
                  <View className="flex-1 mr-2">
                    <TerminalInput
                      value={ammunitionUsed[firearm.id]?.rounds?.toString() ?? ""}
                      onChangeText={(text) => {
                        const num = parseInt(text, 10);
                        onRoundsChange(firearm.id, isNaN(num) ? null : num);
                      }}
                      placeholder="Rounds used"
                      keyboardType="numeric"
                      testID={`rounds-input-${firearm.id}`}
                    />
                  </View>
                  <View className="flex-1">
                    <TouchableOpacity
                      onPress={() => {
                        const compatibleAmmo = ammunition.filter(
                          (a) => a.caliber === firearm.caliber
                        );
                        if (compatibleAmmo.length === 0) {
                          Alert.alert(
                            "Error",
                            "No compatible ammunition found"
                          );
                          return;
                        }
                        Alert.alert(
                          "Select Ammunition",
                          "Choose ammunition type",
                          [
                            ...compatibleAmmo.map((ammo) => ({
                              text: `${ammo.brand} ${ammo.caliber} (${ammo.quantity} rounds)`,
                              onPress: () => {
                                onAmmunitionSelect(firearm.id, ammo.id);
                              },
                            })),
                            { text: "Cancel", style: "cancel" },
                          ]
                        );
                      }}
                    >
                      <TerminalText className="text-terminal-accent">
                        {ammunitionUsed[firearm.id]?.ammunitionId
                          ? ammunition.find(
                              (a) =>
                                a.id ===
                                ammunitionUsed[firearm.id]?.ammunitionId
                            )?.brand
                          : "Select Ammunition"}
                      </TerminalText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        ))}
      </View>

      <View className="my-4">
        <TouchableOpacity
          onPress={onAddBorrowedAmmunition}
          className="border-2 border-terminal-accent p-2"
        >
          <TerminalText>+ Log ammunition for a borrowed firearm</TerminalText>
        </TouchableOpacity>

        {Object.entries(ammunitionUsed)
          .filter(([key]) => key.startsWith("borrowed-"))
          .map(([key, usage]) => {
            const ammoDetails = ammunition.find(
              (a) => a.id === usage.ammunitionId
            );
            return (
              <View
                key={key}
                className="mt-2 p-2 border-2 border-terminal-dim rounded"
              >
                <View className="flex-row justify-between items-center mb-2">
                  <TerminalText>
                    {ammoDetails
                      ? `${ammoDetails.brand} ${ammoDetails.caliber}`
                      : "Borrowed Firearm"}
                  </TerminalText>
                  <TouchableOpacity onPress={() => onRemoveBorrowedAmmunition(key)}>
                    <TerminalText className="text-terminal-error">
                      Remove
                    </TerminalText>
                  </TouchableOpacity>
                </View>
                <TerminalInput
                  value={usage.rounds?.toString() || ""}
                  onChangeText={(text) => {
                    const num = parseInt(text, 10);
                    onBorrowedAmmunitionRoundsChange(key, isNaN(num) ? null : num);
                  }}
                  placeholder="Rounds used"
                  keyboardType="numeric"
                  testID={`borrowed-rounds-input-${key}`}
                />
              </View>
            );
          })}
      </View>
    </View>
  );
};
