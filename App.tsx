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
            options={{ title: "> TERMINAL ACCESS" }}
          />
          <Stack.Screen
            name="AddFirearm"
            component={AddFirearmScreen}
            options={{ title: "> NEW ENTRY" }}
          />
          <Stack.Screen
            name="FirearmDetails"
            component={FirearmDetailsScreen}
            options={{ title: "> DATABASE QUERY" }}
          />
          <Stack.Screen
            name="EditFirearm"
            component={EditFirearmScreen}
            options={{ title: "> EDIT ENTRY" }}
          />
          <Stack.Screen
            name="Stats"
            component={StatsScreen}
            options={{ title: "> SYSTEM STATISTICS" }}
          />
        </Stack.Navigator>
        <StatusBar style="light" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
