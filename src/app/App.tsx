import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View } from "react-native";
import { useFonts, VT323_400Regular } from "@expo-google-fonts/vt323";
import { ScanlinesOverlay } from "../components/scanlines-overlay";

// Import screens
import HomeScreen from "../screens/home/Home";
import AddFirearmScreen from "../screens/add-firearm/AddFirearm";
import FirearmDetailsScreen from "../screens/firearm-details/FirearmDetails";
import EditFirearmScreen from "../screens/edit-firearm/EditFirearm";
import StatsScreen from "../screens/stats/Stats";
import AddRangeVisitScreen from "../screens/add-range-visit/AddRangeVisit";
import RangeVisitDetailsScreen from "../screens/range-visit-details/RangeVisitDetails";
import EditRangeVisitScreen from "../screens/edit-range-visit/EditRangeVisit";
import AddAmmunitionScreen from "../screens/add-ammunition/AddAmmunition";
import AmmunitionDetailsScreen from "../screens/ammunition-details/AmmunitionDetails";
import EditAmmunitionScreen from "../screens/edit-ammunition/EditAmmunition";

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

  // TODO: Remove this once the migration is no longer needed
  // useEffect(() => {
  //   runMigrations().catch(console.error);
  // }, []);

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
              },
              headerTitleAlign: "center",
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen
              name="AddFirearm"
              component={AddFirearmScreen}
              options={{ title: "NEW FIREARM" }}
            />
            <Stack.Screen
              name="FirearmDetails"
              component={FirearmDetailsScreen}
              options={{ title: "FIREARM DETAILS" }}
            />
            <Stack.Screen
              name="EditFirearm"
              component={EditFirearmScreen}
              options={{ title: "EDIT FIREARM" }}
            />
            <Stack.Screen
              name="Stats"
              component={StatsScreen}
              options={{ title: "SYSTEM STATISTICS" }}
            />
            <Stack.Screen
              name="AddRangeVisit"
              component={AddRangeVisitScreen}
              options={{ title: "NEW RANGE VISIT" }}
            />
            <Stack.Screen
              name="RangeVisitDetails"
              component={RangeVisitDetailsScreen}
              options={{ title: "RANGE VISIT DETAILS" }}
            />
            <Stack.Screen
              name="EditRangeVisit"
              component={EditRangeVisitScreen}
              options={{ title: "EDIT RANGE VISIT" }}
            />
            <Stack.Screen
              name="AddAmmunition"
              component={AddAmmunitionScreen}
              options={{ title: "NEW AMMUNITION" }}
            />
            <Stack.Screen
              name="AmmunitionDetails"
              component={AmmunitionDetailsScreen}
              options={{ title: "AMMUNITION DETAILS" }}
            />
            <Stack.Screen
              name="EditAmmunition"
              component={EditAmmunitionScreen}
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
