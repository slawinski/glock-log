import React, { useCallback, useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../app/App";
import { handleError } from "../../services/error-handler";
import { storage } from "../../services/storage-new";
import { getCurrentMount } from "../../services/accessory-service";
import {
  DetailSection,
  ErrorDisplay,
  LoadingScreen,
  TerminalButton,
  TerminalText,
} from "../../components";
import {
  AccessoryStorage,
  FirearmStorage,
} from "../../validation/storageSchemas";

type ManageFirearmAccessoriesScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ManageFirearmAccessories"
>;
type ManageFirearmAccessoriesScreenRouteProp = RouteProp<
  RootStackParamList,
  "ManageFirearmAccessories"
>;

export const ManageFirearmAccessories = () => {
  const navigation = useNavigation<ManageFirearmAccessoriesScreenNavigationProp>();
  const route = useRoute<ManageFirearmAccessoriesScreenRouteProp>();
  const [firearm, setFirearm] = useState<FirearmStorage | null>(null);
  const [accessories, setAccessories] = useState<AccessoryStorage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [firearms, loadedAccessories] = await Promise.all([
        storage.getFirearms(),
        storage.getAccessories(),
      ]);
      setFirearm(firearms.find((f) => f.id === route.params.firearmId) ?? null);
      setAccessories(loadedAccessories.filter((a) => a.status === "active"));
    } catch (e) {
      handleError(e, "ManageFirearmAccessories.fetch", { isUserFacing: true, userMessage: "Failed to load accessories." });
      setError("Failed to load accessories.");
    } finally {
      setLoading(false);
    }
  }, [route.params.firearmId]);

  useFocusEffect(
    useCallback(() => {
      fetch();
    }, [fetch])
  );

  const mount = async (accessoryId: string) => {
    try {
      await storage.mountAccessory(
        accessoryId,
        route.params.firearmId,
        new Date().toISOString()
      );
      fetch();
    } catch (e) {
      handleError(e, "ManageFirearmAccessories.mount", { isUserFacing: true, userMessage: "Failed to mount accessory." });
    }
  };

  const move = async (accessoryId: string) => {
    try {
      await storage.moveAccessory(
        accessoryId,
        route.params.firearmId,
        new Date().toISOString()
      );
      fetch();
    } catch (e) {
      handleError(e, "ManageFirearmAccessories.move", { isUserFacing: true, userMessage: "Failed to move accessory." });
    }
  };

  const unmount = async (accessoryId: string) => {
    try {
      await storage.unmountAccessory(accessoryId, new Date().toISOString());
      fetch();
    } catch (e) {
      handleError(e, "ManageFirearmAccessories.unmount", { isUserFacing: true, userMessage: "Failed to unmount accessory." });
    }
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorDisplay errorMessage={error} onRetry={fetch} />;

  const mounted = accessories.filter((a) => getCurrentMount(a)?.firearmId === route.params.firearmId);
  const unmounted = accessories.filter((a) => !getCurrentMount(a));
  const elsewhere = accessories.filter((a) => {
    const mount = getCurrentMount(a);
    return mount && mount.firearmId !== route.params.firearmId;
  });

  const renderAccessoryRow = (
    accessory: AccessoryStorage,
    action: { caption: string; onPress: () => void }
  ) => (
    <Pressable
      key={accessory.id}
      onPress={() => navigation.navigate("AccessoryDetails", { id: accessory.id })}
      className="py-3 border-b border-terminal-border/30"
      accessibilityRole="button"
      accessibilityLabel={accessory.modelName}
    >
      <View className="flex-row justify-between items-center">
        <TerminalText>{accessory.modelName}</TerminalText>
        <Pressable onPress={action.onPress} accessibilityRole="button" accessibilityLabel={action.caption}>
          <TerminalText className="text-terminal-muted">[{action.caption}]</TerminalText>
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-terminal-bg">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-4 pb-8">
          <TerminalText className="text-2xl mb-1">
            {firearm?.modelName ?? "ACCESSORIES"}
          </TerminalText>
          <TerminalText className="text-terminal-muted text-lg mb-4">ACCESSORIES</TerminalText>

          <DetailSection title="MOUNTED">
            {mounted.length === 0 ? (
              <TerminalText className="text-terminal-muted">None mounted.</TerminalText>
            ) : (
              mounted.map((a) =>
                renderAccessoryRow(a, {
                  caption: "UNMOUNT",
                  onPress: () => unmount(a.id),
                })
              )
            )}
          </DetailSection>

          <DetailSection title="AVAILABLE">
            {unmounted.length === 0 ? (
              <TerminalText className="text-terminal-muted">No unmounted accessories.</TerminalText>
            ) : (
              unmounted.map((a) =>
                renderAccessoryRow(a, { caption: "MOUNT", onPress: () => mount(a.id) })
              )
            )}
          </DetailSection>

          {elsewhere.length > 0 && (
            <DetailSection title="ON OTHER FIREARMS">
              {elsewhere.map((a) =>
                renderAccessoryRow(a, { caption: "MOVE", onPress: () => move(a.id) })
              )}
            </DetailSection>
          )}

          <TerminalButton
            caption="Add new accessory"
            variant="primary"
            onPress={() => navigation.navigate("AddAccessory")}
          />
        </View>
      </ScrollView>
    </View>
  );
};
