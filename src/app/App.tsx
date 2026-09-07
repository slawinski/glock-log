import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View } from "react-native";
import { useFonts, VT323_400Regular } from "@expo-google-fonts/vt323";
import {
  CRTOverlayShader,
  BiometricLock,
  CrtSettingsProvider,
  useCrtSettings,
} from "../components";
import { StorageInit } from "../services/storage-init";

import {
  Home,
  AddFirearm,
  FirearmDetails,
  EditFirearm,
  Stats,
  AddRangeVisit,
  RangeVisitDetails,
  EditRangeVisit,
  AddAmmunition,
  AmmunitionDetails,
  EditAmmunition,
  Menu,
  Settings,
  CurrencySelection,
  DataTransfer,
  LogCleaning,
  CleaningHistory,
  CleaningEventDetails,
  CleaningSettings,
  PartsLife,
  FirearmParts,
  PartDetails,
  AddPart,
  ReplacePart,
  AddAccessory,
  AccessoryDetails,
  EditAccessory,
  ManageFirearmAccessories,
  AccessoryReconciliation,
} from "../screens";

export type RootStackParamList = {
  Home: undefined;
  AddFirearm: undefined;
  FirearmDetails: { id: string };
  EditFirearm: { id: string };
  Stats: undefined;
  AddRangeVisit: undefined;
  RangeVisitDetails: { id: string };
  EditRangeVisit: { id: string };
  AddAmmunition: undefined;
  AmmunitionDetails: { id: string };
  EditAmmunition: { id: string };
  Menu: undefined;
  Settings: undefined;
  CurrencySelection: undefined;
  DataTransfer: undefined;
  LogCleaning: { firearmId: string; eventId?: string };
  CleaningHistory: { firearmId: string };
  CleaningEventDetails: { id: string; firearmId: string };
  CleaningSettings: { firearmId: string };
  PartsLife: undefined;
  FirearmParts: { firearmId: string };
  PartDetails: { slotId: string };
  AddPart: { firearmId: string };
  ReplacePart: { slotId: string };
  AddAccessory: undefined;
  AccessoryDetails: { id: string };
  EditAccessory: { id: string };
  ManageFirearmAccessories: { firearmId: string };
  AccessoryReconciliation: { accessoryId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function App() {
  const [fontsLoaded] = useFonts({
    VT323_400Regular,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <CrtSettingsProvider>
        <AppContent />
      </CrtSettingsProvider>
    </SafeAreaProvider>
  );
}

const AppContent = () => {
  const { crtEnabled } = useCrtSettings();

  return (
    <View className="flex-1 bg-terminal-bg">
      <StorageInit>
        <BiometricLock>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Home"
              screenOptions={{
                headerStyle: {
                  backgroundColor: "#0a0a0a",
                },
                headerTintColor: "#00ff00",
                headerTitleStyle: {
                  fontFamily: "VT323_400Regular",
                  fontWeight: "bold",
                  fontSize: 40,
                },
                contentStyle: {
                  backgroundColor: "#0a0a0a",
                  paddingTop: 16,
                },
                headerTitleAlign: "center",
                headerBackButtonDisplayMode: "minimal",
              }}
            >
              <Stack.Screen name="Home" component={Home} />
              <Stack.Screen
                name="AddFirearm"
                component={AddFirearm}
                options={{ title: "NEW FIREARM" }}
              />
              <Stack.Screen
                name="FirearmDetails"
                component={FirearmDetails}
                options={{ title: "FIREARM DETAILS" }}
              />
              <Stack.Screen
                name="EditFirearm"
                component={EditFirearm}
                options={{ title: "EDIT FIREARM" }}
              />
              <Stack.Screen
                name="Stats"
                component={Stats}
                options={{ title: "SYSTEM STATISTICS" }}
              />
              <Stack.Screen
                name="AddRangeVisit"
                component={AddRangeVisit}
                options={{ title: "NEW RANGE VISIT" }}
              />
              <Stack.Screen
                name="RangeVisitDetails"
                component={RangeVisitDetails}
                options={{ title: "RANGE VISIT DETAILS" }}
              />
              <Stack.Screen
                name="EditRangeVisit"
                component={EditRangeVisit}
                options={{ title: "EDIT RANGE VISIT" }}
              />
              <Stack.Screen
                name="AddAmmunition"
                component={AddAmmunition}
                options={{ title: "NEW AMMUNITION" }}
              />
              <Stack.Screen
                name="AmmunitionDetails"
                component={AmmunitionDetails}
                options={{ title: "AMMUNITION DETAILS" }}
              />
              <Stack.Screen
                name="EditAmmunition"
                component={EditAmmunition}
                options={{ title: "EDIT AMMUNITION" }}
              />
              <Stack.Screen
                name="Menu"
                component={Menu}
                options={{ title: "SYSTEM MENU" }}
              />
              <Stack.Screen
                name="Settings"
                component={Settings}
                options={{ title: "SYSTEM SETTINGS" }}
              />
              <Stack.Screen
                name="CurrencySelection"
                component={CurrencySelection}
                options={{ title: "SELECT CURRENCY" }}
              />
              <Stack.Screen
                name="DataTransfer"
                component={DataTransfer}
                options={{ title: "DATA TRANSFER" }}
              />
              <Stack.Screen
                name="LogCleaning"
                component={LogCleaning}
                options={{ title: "LOG CLEANING" }}
              />
              <Stack.Screen
                name="CleaningHistory"
                component={CleaningHistory}
                options={{ title: "CLEANING HISTORY" }}
              />
              <Stack.Screen
                name="CleaningEventDetails"
                component={CleaningEventDetails}
                options={{ title: "CLEANING EVENT" }}
              />
              <Stack.Screen
                name="CleaningSettings"
                component={CleaningSettings}
                options={{ title: "CLEANING INTERVALS" }}
              />
              <Stack.Screen
                name="PartsLife"
                component={PartsLife}
                options={{ title: "PARTS LIFE" }}
              />
              <Stack.Screen
                name="FirearmParts"
                component={FirearmParts}
                options={{ title: "PARTS LIFE" }}
              />
              <Stack.Screen
                name="PartDetails"
                component={PartDetails}
                options={{ title: "PART DETAILS" }}
              />
              <Stack.Screen
                name="AddPart"
                component={AddPart}
                options={{ title: "ADD TRACKED PART" }}
              />
              <Stack.Screen
                name="ReplacePart"
                component={ReplacePart}
                options={{ title: "REPLACE PART" }}
              />
              <Stack.Screen
                name="AddAccessory"
                component={AddAccessory}
                options={{ title: "NEW ACCESSORY" }}
              />
              <Stack.Screen
                name="AccessoryDetails"
                component={AccessoryDetails}
                options={{ title: "ACCESSORY DETAILS" }}
              />
              <Stack.Screen
                name="EditAccessory"
                component={EditAccessory}
                options={{ title: "EDIT ACCESSORY" }}
              />
              <Stack.Screen
                name="ManageFirearmAccessories"
                component={ManageFirearmAccessories}
                options={{ title: "MANAGE ACCESSORIES" }}
              />
              <Stack.Screen
                name="AccessoryReconciliation"
                component={AccessoryReconciliation}
                options={{ title: "REVIEW USAGE" }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </BiometricLock>
      </StorageInit>
      <StatusBar style="light" />
      {crtEnabled === true && <CRTOverlayShader />}
    </View>
  );
};
