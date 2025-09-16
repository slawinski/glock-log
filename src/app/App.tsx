import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View } from "react-native";
import { useFonts, VT323_400Regular } from "@expo-google-fonts/vt323";
import { ScanlinesOverlay } from "../components";

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
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [fontsLoaded] = useFonts({
    VT323_400Regular,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <View className="flex-1 bg-terminal-bg">
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
                fontSize: 34,
              },
              contentStyle: {
                backgroundColor: "#0a0a0a",
                paddingTop: 16,
                paddingLeft: 16,
                paddingRight: 16,
                paddingBottom: 32,
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
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="light" />
        <ScanlinesOverlay />
      </View>
    </SafeAreaProvider>
  );
}
