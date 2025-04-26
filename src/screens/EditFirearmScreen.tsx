import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import * as ImagePicker from "react-native-image-picker";
import { Firearm } from "../services/storage";
import { storage } from "../services/storage";
import { TerminalText, TerminalInput } from "../components/Terminal";
import DateTimePicker from "@react-native-community/datetimepicker";

type EditFirearmScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EditFirearm"
>;
type EditFirearmScreenRouteProp = RouteProp<RootStackParamList, "EditFirearm">;

export default function EditFirearmScreen() {
  const navigation = useNavigation<EditFirearmScreenNavigationProp>();
  const route = useRoute<EditFirearmScreenRouteProp>();
  const [formData, setFormData] = useState<Omit<Firearm, "id">>({
    modelName: "",
    caliber: "",
    datePurchased: new Date().toISOString(),
    amountPaid: 0,
    photos: [],
    roundsFired: 0,
    notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (route.params?.id) {
      fetchFirearm();
    }
  }, [route.params?.id]);

  const fetchFirearm = async () => {
    try {
      setLoading(true);
      const firearms = await storage.getFirearms();
      const firearm = firearms.find((f) => f.id === route.params!.id);
      if (firearm) {
        const { id, ...firearmData } = firearm;
        setFormData(firearmData);
      } else {
        setError("Firearm not found");
      }
    } catch (error) {
      console.error("Error fetching firearm:", error);
      Alert.alert("Error", "Failed to load firearm data");
    } finally {
      setLoading(false);
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
            notes: prev.notes
              ? `${prev.notes}\n${response.assets![0].uri!}`
              : response.assets![0].uri!,
          }));
        }
      }
    );
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      // Validate required fields
      if (!formData.modelName || !formData.caliber) {
        Alert.alert("Error", "Model name and caliber are required");
        return;
      }

      const updatedFirearm: Firearm = {
        ...formData,
        id: route.params.id,
      };

      await storage.saveFirearm(updatedFirearm);
      navigation.goBack();
    } catch (error) {
      console.error("Error updating firearm:", error);
      Alert.alert("Error", "Failed to update firearm. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePhoto = (index: number) => {
    if (formData.notes) {
      const photos = formData.notes.split("\n");
      photos.splice(index, 1);
      setFormData((prev) => ({
        ...prev,
        notes: photos.join("\n"),
      }));
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-terminal-bg">
        <ActivityIndicator size="large" color="#00ff00" />
        <TerminalText className="mt-4">LOADING DATABASE...</TerminalText>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-terminal-bg">
        <TerminalText className="text-terminal-error text-lg">
          {error}
        </TerminalText>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-terminal-bg p-4">
      <TerminalText className="text-2xl mb-6">EDIT FIREARM</TerminalText>

      <View className="mb-4">
        <TerminalText>MODEL NAME</TerminalText>
        <TerminalInput
          value={formData.modelName}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, modelName: text }))
          }
          placeholder="e.g., Glock 19"
        />
      </View>

      <View className="mb-4">
        <TerminalText>CALIBER</TerminalText>
        <TerminalInput
          value={formData.caliber}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, caliber: text }))
          }
          placeholder="e.g., 9mm"
        />
      </View>

      <View className="mb-4">
        <TerminalText>DATE PURCHASED</TerminalText>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          className="border border-terminal-border p-2"
        >
          <TerminalText>
            {new Date(formData.datePurchased).toLocaleDateString()}
          </TerminalText>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={new Date(formData.datePurchased)}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setFormData((prev) => ({
                  ...prev,
                  datePurchased: selectedDate.toISOString(),
                }));
              }
            }}
          />
        )}
      </View>

      <View className="mb-4">
        <TerminalText>PHOTOS</TerminalText>
        <TouchableOpacity
          onPress={handleImagePick}
          className="border border-terminal-border p-3 mb-2"
        >
          <TerminalText>ADD PHOTO</TerminalText>
        </TouchableOpacity>
        <ScrollView horizontal className="flex-row">
          {formData.notes?.split("\n").map((photo, index) => (
            <View key={index} className="relative">
              <Image source={{ uri: photo }} className="w-40 h-40 m-1" />
              <TouchableOpacity
                onPress={() => handleDeletePhoto(index)}
                className="absolute top-0 right-0 bg-terminal-error p-1"
              >
                <TerminalText className="text-xs">X</TerminalText>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      {error && (
        <View className="mb-4">
          <TerminalText className="text-terminal-error">{error}</TerminalText>
        </View>
      )}

      <View className="flex-row justify-between">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="border border-terminal-border px-4 py-2"
        >
          <TerminalText>CANCEL</TerminalText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={saving}
          className="border border-terminal-border px-4 py-2"
        >
          <TerminalText>{saving ? "SAVING..." : "SAVE CHANGES"}</TerminalText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
