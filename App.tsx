import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Import screens (we'll create these next)
import HomeScreen from "./src/screens/HomeScreen";
import AddFirearmScreen from "./src/screens/AddFirearmScreen";
import FirearmDetailsScreen from "./src/screens/FirearmDetailsScreen";
import EditFirearmScreen from "./src/screens/EditFirearmScreen";
import StatsScreen from "./src/screens/StatsScreen";

export type RootStackParamList = {
  Home: undefined;
  AddFirearm: undefined;
  FirearmDetails: { id: string };
  EditFirearm: { id: string };
  Stats: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: "#1a365d",
            },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: "My Firearms" }}
          />
          <Stack.Screen
            name="AddFirearm"
            component={AddFirearmScreen}
            options={{ title: "Add New Firearm" }}
          />
          <Stack.Screen
            name="FirearmDetails"
            component={FirearmDetailsScreen}
            options={{ title: "Firearm Details" }}
          />
          <Stack.Screen
            name="EditFirearm"
            component={EditFirearmScreen}
            options={{ title: "Edit Firearm" }}
          />
          <Stack.Screen
            name="Stats"
            component={StatsScreen}
            options={{ title: "Statistics" }}
          />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
