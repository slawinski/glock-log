import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import * as ImagePicker from "react-native-image-picker";
import { RangeVisitInput } from "../types/rangeVisit";
import { Firearm } from "../types/firearm";
import { api } from "../services/api";
import { Terminal, TerminalText, TerminalInput } from "../components/Terminal";

type AddRangeVisitScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AddRangeVisit"
>;

export default function AddRangeVisitScreen() {
  const navigation = useNavigation<AddRangeVisitScreenNavigationProp>();
  const [loading, setLoading] = useState(false);
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [formData, setFormData] = useState<RangeVisitInput>({
    date: new Date(),
    location: "",
    notes: "",
    firearmsUsed: [],
    roundsPerFirearm: {},
    photos: [],
  });

  useEffect(() => {
    fetchFirearms();
  }, []);

  const fetchFirearms = async () => {
    try {
      const data = await api.getFirearms();
      setFirearms(data);
    } catch (error) {
      console.error("Error fetching firearms:", error);
      Alert.alert("Error", "Failed to load firearms");
    }
  };

  const handleImagePick = () => {
    ImagePicker.launchImageLibrary(
      {
        mediaType: "photo",
        quality: 0.8,
      },
      (response) => {
        if (response.assets && response.assets[0].uri) {
          setFormData((prev) => ({
            ...prev,
            photos: [...prev.photos, response.assets![0].uri!],
          }));
        }
      }
    );
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (!formData.location || formData.firearmsUsed.length === 0) {
        Alert.alert(
          "Missing Information",
          `Please fill in all required fields:
          
          • Location: ${formData.location ? "✓" : "✗"} (Where did you shoot?)
          • Firearms: ${
            formData.firearmsUsed.length > 0 ? "✓" : "✗"
          } (Select at least one firearm)
          
          Tap on the fields above to add the missing information.`,
          [{ text: "OK" }]
        );
        return;
      }

      // Validate rounds per firearm
      for (const firearmId of formData.firearmsUsed) {
        if (
          !formData.roundsPerFirearm[firearmId] ||
          formData.roundsPerFirearm[firearmId] <= 0
        ) {
          Alert.alert(
            "Missing Information",
            `Please specify the number of rounds fired for each selected firearm.`,
            [{ text: "OK" }]
          );
          return;
        }
      }

      const response = await api.createRangeVisit(formData);
      navigation.goBack();
    } catch (error) {
      console.error("Error saving range visit:", error);
      Alert.alert(
        "Error",
        `Failed to save range visit:
        ${error instanceof Error ? error.message : "Unknown error"}
        
        Please check:
        1. Location is filled
        2. At least one firearm is selected
        3. Rounds are specified for each firearm
        4. Server is running
        5. Network connection is stable`
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleFirearmSelection = (firearmId: string) => {
    setFormData((prev) => {
      const newFirearmsUsed = prev.firearmsUsed.includes(firearmId)
        ? prev.firearmsUsed.filter((id) => id !== firearmId)
        : [...prev.firearmsUsed, firearmId];

      // Remove rounds data for deselected firearms
      const newRoundsPerFirearm = { ...prev.roundsPerFirearm };
      if (!newFirearmsUsed.includes(firearmId)) {
        delete newRoundsPerFirearm[firearmId];
      }

      return {
        ...prev,
        firearmsUsed: newFirearmsUsed,
        roundsPerFirearm: newRoundsPerFirearm,
      };
    });
  };

  const updateRoundsForFirearm = (firearmId: string, rounds: string) => {
    setFormData((prev) => ({
      ...prev,
      roundsPerFirearm: {
        ...prev.roundsPerFirearm,
        [firearmId]: parseInt(rounds) || 0,
      },
    }));
  };

  return (
    <ScrollView className="flex-1 bg-terminal-bg p-4">
      <Terminal title="ADD RANGE VISIT">
        <View className="mb-4">
          <TerminalText className="text-lg mb-2">LOCATION</TerminalText>
          <TerminalInput
            value={formData.location}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, location: text }))
            }
            placeholder="e.g., Local Range"
          />
        </View>

        <View className="mb-4">
          <TerminalText className="text-lg mb-2">DATE</TerminalText>
          <TerminalInput
            value={formData.date.toLocaleDateString()}
            onChangeText={() => {}}
          />
        </View>

        <View className="mb-4">
          <TerminalText className="text-lg mb-2">NOTES</TerminalText>
          <TextInput
            className="bg-terminal-bg border border-terminal-border p-2 text-terminal-text font-terminal"
            placeholder="Notes (optional)"
            placeholderTextColor="#003300"
            value={formData.notes}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, notes: text }))
            }
            multiline
          />
        </View>

        <View className="mb-4">
          <TerminalText className="text-lg mb-2">FIREARMS USED</TerminalText>
          {firearms.map((firearm) => (
            <View
              key={firearm.id}
              className={`border border-terminal-border p-2 mb-2 ${
                formData.firearmsUsed.includes(firearm.id)
                  ? "bg-terminal-selection"
                  : ""
              }`}
            >
              <TouchableOpacity
                onPress={() => toggleFirearmSelection(firearm.id)}
                className="mb-2"
              >
                <TerminalText>
                  {firearm.modelName} ({firearm.caliber})
                </TerminalText>
              </TouchableOpacity>

              {formData.firearmsUsed.includes(firearm.id) && (
                <View className="mt-2">
                  <TerminalText className="text-terminal-dim mb-1">
                    ROUNDS FIRED
                  </TerminalText>
                  <TerminalInput
                    value={
                      formData.roundsPerFirearm[firearm.id]?.toString() || ""
                    }
                    onChangeText={(text) =>
                      updateRoundsForFirearm(firearm.id, text)
                    }
                    placeholder="Enter number of rounds"
                    keyboardType="numeric"
                  />
                </View>
              )}
            </View>
          ))}
        </View>

        <View className="mb-4">
          <TerminalText className="text-lg mb-2">PHOTOS</TerminalText>
          <TouchableOpacity
            onPress={handleImagePick}
            className="border border-terminal-border p-3 mb-2"
          >
            <TerminalText>ADD PHOTO</TerminalText>
          </TouchableOpacity>
          <View className="flex-row flex-wrap">
            {formData.photos.map((photo, index) => (
              <Image
                key={index}
                source={{ uri: photo }}
                className="w-20 h-20 m-1 border border-terminal-border"
              />
            ))}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          className="border border-terminal-border p-3 mb-4"
          disabled={loading}
        >
          <TerminalText>{loading ? "SAVING..." : "SAVE VISIT"}</TerminalText>
        </TouchableOpacity>
      </Terminal>
    </ScrollView>
  );
}
