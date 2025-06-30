import React, { useState, useEffect } from "react";
import { View, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../app/App";
import { storage } from "../../services/storage-new";
import { TerminalText } from "../../components/terminal-text/TerminalText";
import { ImageGallery } from "../../components/image-gallery";
import { FirearmStorage } from "../../validation/storageSchemas";
import { TerminalButton } from "../../components/terminal-button/TerminalButton";

type FirearmDetailsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "FirearmDetails"
>;
type FirearmDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  "FirearmDetails"
>;

export default function FirearmDetailsScreen() {
  const navigation = useNavigation<FirearmDetailsScreenNavigationProp>();
  const route = useRoute<FirearmDetailsScreenRouteProp>();
  const [firearm, setFirearm] = useState<FirearmStorage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFirearm();
  }, [route.params.id]);

  const fetchFirearm = async () => {
    try {
      setLoading(true);
      setError(null);
      const firearms = await storage.getFirearms();
      const foundFirearm = firearms.find((f) => f.id === route.params.id);
      if (foundFirearm) {
        setFirearm(foundFirearm);
      } else {
        setError("Firearm not found");
      }
    } catch (error) {
      console.error("Error fetching firearm:", error);
      setError("Failed to load firearm details");
    } finally {
      setLoading(false);
    }
  };

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
              console.error("Error deleting firearm:", error);
              Alert.alert(
                "Error",
                "Failed to delete firearm. Please try again."
              );
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
      <View className="flex-1 justify-center items-center bg-terminal-bg">
        <TerminalText className="text-terminal-error text-lg">
          {error || "ENTRY NOT FOUND"}
        </TerminalText>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-terminal-bg">
      <View className="p-4">
        <View className="mb-4">
          <View className="flex-row items-center">
            <TerminalText className="text-lg">MODEL: </TerminalText>
            <TerminalText className="text-lg">{firearm.modelName}</TerminalText>
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
          <TerminalText>${firearm.amountPaid.toFixed(2)}</TerminalText>
        </View>

        {firearm.notes && (
          <View className="mb-4 flex-row">
            <TerminalText>NOTES: </TerminalText>
            <TerminalText className="flex-shrink">{firearm.notes}</TerminalText>
          </View>
        )}

        {firearm.photos && firearm.photos.length > 0 && (
          <View className="mb-4">
            <TerminalText className="text-lg mb-2">PHOTOS</TerminalText>
            <ImageGallery
              images={firearm.photos}
              size="large"
              showDeleteButton={false}
            />
          </View>
        )}

        <View className="flex-row justify-between mt-4">
          <TerminalButton
            onPress={() =>
              navigation.navigate("EditFirearm", { id: firearm.id })
            }
            caption="EDIT"
          />
          <TerminalButton onPress={handleDelete} caption="DELETE" />
          <TerminalButton onPress={() => navigation.goBack()} caption="BACK" />
        </View>
      </View>
    </ScrollView>
  );
}
