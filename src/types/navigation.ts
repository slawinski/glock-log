import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../app/App";

/**
 * Navigation prop for screens reachable from the Home tab navigator.
 *
 * Previously duplicated in FirearmsTab, AmmunitionTab, and VisitsTab.
 */
export type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;
