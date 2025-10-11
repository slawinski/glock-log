import React, { useState, useCallback } from "react";
import { View, ScrollView, Alert, ActivityIndicator } from "react-native";
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
import {
  BottomButtonGroup,
  ErrorDisplay,
  ImageGallery,
  TerminalText,
} from "../../components";
import { FirearmStorage } from "../../validation/storageSchemas";
import { formatCurrency } from "../../utils/currency";

type FirearmDetailsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "FirearmDetails"
>;
type FirearmDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  "FirearmDetails"
>;

export const FirearmDetails = () => {
  const navigation = useNavigation<FirearmDetailsScreenNavigationProp>();
  const route = useRoute<FirearmDetailsScreenRouteProp>();
  const [firearm, setFirearm] = useState<FirearmStorage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string>("USD");

  const fetchFirearm = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [firearms, currentCurrency] = await Promise.all([
        storage.getFirearms(),
        storage.getCurrency(),
      ]);
      const foundFirearm = firearms.find((f) => f.id === route.params.id);
      if (foundFirearm) {
        setFirearm(foundFirearm);
      } else {
        setError("Firearm not found");
      }
      setCurrency(currentCurrency);
    } catch (error) {
      handleError(error, "FirearmDetails.fetchFirearm", { isUserFacing: true, userMessage: "Failed to load firearm details." });
      setError("Failed to load firearm details.");
    } finally {
      setLoading(false);
    }
  }, [route.params.id]);

  useFocusEffect(
    useCallback(() => {
      fetchFirearm();
    }, [fetchFirearm])
  );

  const handleDelete = async () => {
    if (!firearm) return;

    Alert.alert(
      "Delete Firearm",
      "Are you sure you want to delete this firearm? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await storage.deleteFirearm(firearm.id);
              navigation.goBack();
            } catch (error) {
              handleError(error, "FirearmDetails.handleDelete", { isUserFacing: true, userMessage: "Failed to delete firearm. Please try again." });
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-terminal-bg">
        <ActivityIndicator size="large" color="#00ff00" />
        <TerminalText className="mt-4">LOADING DATABASE...</TerminalText>
      </View>
    );
  }

  if (error || !firearm) {
    return (
      <ErrorDisplay
        errorMessage={error || "ENTRY NOT FOUND"}
        onRetry={fetchFirearm}
      />
    );
  }

  return (
    <View className="flex-1 bg-terminal-bg">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1">
          <View className="mb-4">
            <View className="flex-row items-center">
              <TerminalText className="text-lg">MODEL: </TerminalText>
              <TerminalText className="text-lg">
                {firearm.modelName}
              </TerminalText>
            </View>
            <View className="flex-row items-center">
              <TerminalText>CALIBER: </TerminalText>
              <TerminalText>{firearm.caliber}</TerminalText>
            </View>
          </View>

          <View className="mb-4 flex-row">
            <TerminalText>ROUNDS FIRED: </TerminalText>
            <TerminalText>{firearm.roundsFired} rounds</TerminalText>
          </View>

          <View className="mb-4 flex-row">
            <TerminalText>DATE PURCHASED: </TerminalText>
            <TerminalText>
              {new Date(firearm.datePurchased).toLocaleDateString()}
            </TerminalText>
          </View>

          <View className="mb-4 flex-row">
            <TerminalText>AMOUNT PAID: </TerminalText>
            <TerminalText>
              {formatCurrency(firearm.amountPaid, currency)}
            </TerminalText>
          </View>

          {firearm.notes && (
            <View className="mb-4 flex-row">
              <TerminalText>NOTES: </TerminalText>
              <TerminalText className="flex-shrink">
                {firearm.notes}
              </TerminalText>
            </View>
          )}

          {firearm.photos && firearm.photos.length > 0 && (
            <View className="mb-4">
              <TerminalText className="text-lg mb-2">PHOTOS:</TerminalText>
              <ImageGallery
                images={firearm.photos}
                size="large"
                showDeleteButton={false}
              />
            </View>
          )}

          <View className="flex-1" />

          <BottomButtonGroup
            className="mt-4"
            buttons={[
              {
                caption: "EDIT",
                onPress: () =>
                  navigation.navigate("EditFirearm", { id: firearm.id }),
              },
              {
                caption: "DELETE",
                onPress: handleDelete,
              },
              {
                caption: "BACK",
                onPress: () => navigation.goBack(),
              },
            ]}
          />
        </View>
      </ScrollView>
    </View>
  );
};
