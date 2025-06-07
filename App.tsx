import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Import screens
import HomeScreen from "./src/screens/HomeScreen";
import AddFirearmScreen from "./src/screens/add-firearm/AddFirearm";
import FirearmDetailsScreen from "./src/screens/FirearmDetailsScreen";
import EditFirearmScreen from "./src/screens/EditFirearmScreen";
import StatsScreen from "./src/screens/StatsScreen";
import AddRangeVisitScreen from "./src/screens/AddRangeVisitScreen";
import RangeVisitDetailsScreen from "./src/screens/RangeVisitDetailsScreen";
import EditRangeVisitScreen from "./src/screens/EditRangeVisitScreen";
import AddAmmunitionScreen from "./src/screens/add-ammunition/AddAmmunition";
import AmmunitionDetailsScreen from "./src/screens/AmmunitionDetailsScreen";
import EditAmmunitionScreen from "./src/screens/EditAmmunitionScreen";

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
  // TODO: Remove this once the migration is no longer needed
  // useEffect(() => {
  //   runMigrations().catch(console.error);
  // }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: "#0a0a0a",
            },
            headerTintColor: "#00ff00",
            headerTitleStyle: {
              fontFamily: "Courier New",
              fontWeight: "bold",
            },
            contentStyle: {
              backgroundColor: "#0a0a0a",
            },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: "> GLOCK LOG" }}
          />
          <Stack.Screen
            name="AddFirearm"
            component={AddFirearmScreen}
            options={{ title: "> NEW FIREARM" }}
          />
          <Stack.Screen
            name="FirearmDetails"
            component={FirearmDetailsScreen}
            options={{ title: "> FIREARM DETAILS" }}
          />
          <Stack.Screen
            name="EditFirearm"
            component={EditFirearmScreen}
            options={{ title: "> EDIT FIREARM" }}
          />
          <Stack.Screen
            name="Stats"
            component={StatsScreen}
            options={{ title: "> SYSTEM STATISTICS" }}
          />
          <Stack.Screen
            name="AddRangeVisit"
            component={AddRangeVisitScreen}
            options={{ title: "> NEW RANGE VISIT" }}
          />
          <Stack.Screen
            name="RangeVisitDetails"
            component={RangeVisitDetailsScreen}
            options={{ title: "> RANGE VISIT DETAILS" }}
          />
          <Stack.Screen
            name="EditRangeVisit"
            component={EditRangeVisitScreen}
            options={{ title: "> EDIT RANGE VISIT" }}
          />
          <Stack.Screen
            name="AddAmmunition"
            component={AddAmmunitionScreen}
            options={{ title: "> NEW AMMUNITION" }}
          />
          <Stack.Screen
            name="AmmunitionDetails"
            component={AmmunitionDetailsScreen}
            options={{ title: "> AMMUNITION DETAILS" }}
          />
          <Stack.Screen
            name="EditAmmunition"
            component={EditAmmunitionScreen}
            options={{ title: "> EDIT AMMUNITION" }}
          />
        </Stack.Navigator>
        <StatusBar style="light" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
