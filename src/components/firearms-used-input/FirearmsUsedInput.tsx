import React, { FC, PropsWithChildren, useState } from "react";
import { View, Pressable, Alert } from "react-native";
import { TerminalText, TerminalInput, TerminalButton } from "../";
import {
  AmmunitionStorage,
  FirearmOwnership,
} from "../../validation/storageSchemas";

type Firearm = {
  id: string;
  modelName: string;
  caliber: string;
  ownership: FirearmOwnership;
};

type AmmunitionUsed = {
  [key: string]: { ammunitionId?: string; rounds: string };
};

type FirearmsUsedInputProps = {
  firearms: Firearm[];
  ammunition: AmmunitionStorage[];
  selectedFirearms: string[];
  ammunitionUsed: AmmunitionUsed;
  onToggleFirearm: (firearmId: string) => void;
  onRoundsChange: (firearmId: string, rounds: string) => void;
  onAmmunitionSelect: (firearmId: string, ammunitionId: string) => void;
  onAddBorrowedFirearm: (
    modelName: string,
    caliber: string
  ) => void | Promise<void>;
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
  onAddBorrowedFirearm,
}) => {
  const [isAddBorrowedOpen, setIsAddBorrowedOpen] = useState(false);
  const [borrowedModelName, setBorrowedModelName] = useState("");
  const [borrowedCaliber, setBorrowedCaliber] = useState("");
  const [borrowedFormError, setBorrowedFormError] = useState<string | null>(
    null
  );

  const resetBorrowedForm = () => {
    setBorrowedModelName("");
    setBorrowedCaliber("");
    setBorrowedFormError(null);
    setIsAddBorrowedOpen(false);
  };

  const handleSubmitBorrowed = async () => {
    const modelName = borrowedModelName.trim();
    const caliber = borrowedCaliber.trim();
    if (!modelName || !caliber) {
      setBorrowedFormError("Enter both a model name and caliber.");
      return;
    }
    await onAddBorrowedFirearm(modelName, caliber);
    resetBorrowedForm();
  };

  const getAmmunitionSelectionLabel = (firearmId: string) => {
    const ammoId = ammunitionUsed[firearmId]?.ammunitionId;
    return ammoId
      ? ammunition.find((a) => a.id === ammoId)?.brand ?? "Select Ammunition"
      : "Select Ammunition";
  };

  return (
    <View>
      <View className="mb-4">
        {firearms.map((firearm) => (
          <View key={firearm.id} className="mb-2">
            <Pressable
              onPress={() => onToggleFirearm(firearm.id)}
              className={`border-2 p-2 ${
                selectedFirearms.includes(firearm.id)
                  ? "border-terminal-accent"
                  : "border-terminal-border"
              }`}
              accessibilityRole="button"
              accessibilityLabel={`${firearm.modelName} ${firearm.caliber}`}
              accessibilityState={{
                selected: selectedFirearms.includes(firearm.id),
              }}
            >
              <TerminalText>{firearm.modelName}</TerminalText>
              <View className="flex-row items-center">
                <TerminalText className="text-sm text-terminal-muted">
                  {firearm.caliber}
                </TerminalText>
                {firearm.ownership === "borrowed" && (
                  <TerminalText className="text-xs text-terminal-muted ml-2 border border-terminal-dim px-1">
                    BORROWED
                  </TerminalText>
                )}
              </View>
            </Pressable>
            {selectedFirearms.includes(firearm.id) && (
              <View className="mt-2">
                <TerminalText>AMMUNITION USED</TerminalText>
                <View className="flex-row items-center">
                  <View className="flex-1 mr-2">
                    <TerminalInput
                      value={ammunitionUsed[firearm.id]?.rounds ?? ""}
                      onChangeText={(text) => onRoundsChange(firearm.id, text)}
                      placeholder="Rounds used"
                      keyboardType="numeric"
                      testID={`rounds-input-${firearm.id}`}
                    />
                  </View>
                  <View className="flex-1">
                    <Pressable
                      onPress={() => {
                        const compatibleAmmo = ammunition.filter(
                          (a) => a.caliber === firearm.caliber && a.quantity > 0
                        );
                        if (compatibleAmmo.length === 0) {
                          Alert.alert(
                            "No Stock",
                            `No ${firearm.caliber} ammunition in stock.`
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
                      className="min-h-[44px] justify-center"
                      accessibilityRole="button"
                      accessibilityLabel={getAmmunitionSelectionLabel(firearm.id)}
                      accessibilityHint="Opens a list of compatible ammunition in stock"
                    >
                      <TerminalText className="text-terminal-accent">
                        {getAmmunitionSelectionLabel(firearm.id)}
                      </TerminalText>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
          </View>
        ))}
      </View>

      <View className="my-4">
        {!isAddBorrowedOpen ? (
          <Pressable
            onPress={() => setIsAddBorrowedOpen(true)}
            className="border-2 border-terminal-accent p-2"
            accessibilityRole="button"
            accessibilityLabel="Add borrowed gun"
            testID="add-borrowed-gun-button"
          >
            <TerminalText>+ Add borrowed gun</TerminalText>
          </Pressable>
        ) : (
          <View className="border-2 border-terminal-border p-2">
            <TerminalText className="text-terminal-muted">
              BORROWED FIREARM
            </TerminalText>

            <TerminalText className="mb-1.5 mt-2">MODEL NAME</TerminalText>
            <TerminalInput
              value={borrowedModelName}
              onChangeText={setBorrowedModelName}
              placeholder="Model name"
              testID="borrowed-model-input"
            />

            <TerminalText className="mb-1.5 mt-2">CALIBER</TerminalText>
            <TerminalInput
              value={borrowedCaliber}
              onChangeText={setBorrowedCaliber}
              placeholder="Caliber"
              testID="borrowed-caliber-input"
            />

            {borrowedFormError && (
              <TerminalText
                className="text-terminal-error text-sm mt-1"
                accessibilityLiveRegion="polite"
              >
                {borrowedFormError}
              </TerminalText>
            )}

            <View className="flex-row mt-2">
              <TerminalButton
                caption="Add"
                className="flex-1 mr-2"
                onPress={handleSubmitBorrowed}
                testID="add-borrowed-gun-submit"
              />
              <TerminalButton
                caption="Cancel"
                className="flex-1"
                onPress={resetBorrowedForm}
                testID="add-borrowed-gun-cancel"
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
};
