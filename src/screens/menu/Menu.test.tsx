import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Menu } from "./Menu";

const Stack = createNativeStackNavigator();

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

const renderScreen = () => {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Menu" component={Menu} />
        <Stack.Screen name="Settings" component={() => <></>} />
        <Stack.Screen name="Stats" component={() => <></>} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

describe("Menu", () => {
  it("renders all menu items", () => {
    renderScreen();
    expect(screen.getByText("├── STATISTICS")).toBeTruthy();
    expect(screen.getByText("├── SETTINGS")).toBeTruthy();
    expect(screen.getByText("└── ABOUT")).toBeTruthy();
  });

  it("navigates to Settings screen when Settings is pressed", async () => {
    renderScreen();
    const settingsItem = screen.getByText("├── SETTINGS");
    fireEvent.press(settingsItem);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("Settings");
    });
  });

  it("navigates to Stats screen when Stats is pressed", async () => {
    renderScreen();
    const statsItem = screen.getByText("├── STATISTICS");
    fireEvent.press(statsItem);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("Stats");
    });
  });

  it("displays About information when About is pressed", async () => {
    const alertSpy = jest.spyOn(require("react-native").Alert, "alert");
    renderScreen();
    const aboutItem = screen.getByText("└── ABOUT");
    fireEvent.press(aboutItem);
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "About",
        "TriggerNote is a simple application to track your shooting hobby."
      );
    });
  });
});
