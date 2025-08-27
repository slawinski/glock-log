import React, { useState, useEffect } from "react";
import { View, ScrollView, Alert, ActivityIndicator, Dimensions } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../app/App";
import { storage } from "../../services/storage-new";
import { TerminalText, ImageGallery, TerminalButton } from "../../components";
import { FirearmStorage } from "../../validation/storageSchemas";

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
  
  // Calculate separator width based on screen width
  const screenWidth = Dimensions.get('window').width;
  const paddingHorizontal = 32; // p-4 = 16px * 2 sides
  const availableWidth = screenWidth - paddingHorizontal;
  // Use a more accurate character width calculation based on screen density
  const baseCharWidth = 6.5; // Fine-tuned character width for terminal font
  const densityMultiplier = screenWidth > 400 ? 1.05 : 0.95; // Slight adjustment for different screens
  const charWidth = baseCharWidth * densityMultiplier;
  const separatorLength = Math.round(availableWidth / charWidth) - 3;

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
    <View className="flex-1 bg-terminal-bg">
      <View className="flex-1 p-4">
        {firearm.photos && firearm.photos.length > 0 ? (
          // 2x3 Grid layout with photo in center surrounded by data
          <View>
            {/* Row 1: Model and Caliber */}
            <View className="flex-row justify-between" style={{ minHeight: 60 }}>
              <View className="flex-1 justify-center items-start p-1">
                <TerminalText className="text-base mb-1">MODEL</TerminalText>
                <TerminalText className="text-base">
                  {firearm.modelName}
                </TerminalText>
              </View>
              <View style={{ width: 1, backgroundColor: "#00ff00" }} />
              <View className="flex-1 justify-center items-end p-1">
                <TerminalText className="text-base mb-1">CALIBER</TerminalText>
                <TerminalText className="text-base">
                  {firearm.caliber}
                </TerminalText>
              </View>
            </View>

            {/* Horizontal separator */}
            <TerminalText className="text-terminal-green">
              {"=".repeat(separatorLength)}
            </TerminalText>

            {/* Row 2: Rounds Fired and Photos */}
            <View className="flex-row justify-between" style={{ minHeight: 200 }}>
              <View className="flex-1 justify-between items-start p-1">
                <View className="items-start">
                  <TerminalText className="text-base mb-1">
                    ROUNDS FIRED
                  </TerminalText>
                  <TerminalText className="text-base">
                    {firearm.roundsFired} rounds
                  </TerminalText>
                </View>
                
                <View className="items-start">
                  <TerminalText className="text-base mb-1">
                    DATE PURCHASED
                  </TerminalText>
                  <TerminalText className="text-base">
                    {new Date(firearm.datePurchased).toLocaleDateString()}
                  </TerminalText>
                </View>

                <View className="items-start">
                  <TerminalText className="text-base mb-1">
                    AMOUNT PAID
                  </TerminalText>
                  <TerminalText className="text-base">
                    ${firearm.amountPaid.toFixed(2)}
                  </TerminalText>
                </View>
              </View>
              <View style={{ width: 1, backgroundColor: "#00ff00" }} />
              <View className="flex-1 p-1 justify-center items-end">
                <View className="flex-1 w-full">
                  <ImageGallery
                    images={firearm.photos}
                    size="large"
                    showDeleteButton={false}
                  />
                </View>
              </View>
            </View>

            {/* Horizontal separator */}
            <TerminalText className="text-terminal-green">
              {"=".repeat(separatorLength)}
            </TerminalText>


            {/* Row 4: Notes (spans full width if present) */}
            {firearm.notes && (
              <>
                <TerminalText className="text-terminal-green text-center">
                  {"=".repeat(40)}
                </TerminalText>
                <View
                  className="justify-center items-center p-1"
                  style={{ minHeight: 50 }}
                >
                  <TerminalText className="text-base mb-1 text-center">
                    NOTES
                  </TerminalText>
                  <TerminalText className="text-base text-center">
                    {firearm.notes}
                  </TerminalText>
                </View>
              </>
            )}
          </View>
        ) : (
          // Single column layout when no photos
          <View className="mb-6">
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
              <TerminalText>${firearm.amountPaid.toFixed(2)}</TerminalText>
            </View>

            {firearm.notes && (
              <View className="mb-4 flex-row">
                <TerminalText>NOTES: </TerminalText>
                <TerminalText className="flex-shrink">
                  {firearm.notes}
                </TerminalText>
              </View>
            )}
          </View>
        )}

        <View className="flex-row justify-between pt-4 pb-8">
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
    </View>
  );
}
