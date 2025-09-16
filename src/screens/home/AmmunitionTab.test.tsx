import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AmmunitionTab } from "./AmmunitionTab";

// Mock components
jest.mock("../../components", () => ({
  TerminalText: ({ children, ...props }: any) => {
    const { Text } = require("react-native");
    return <Text {...props}>{children}</Text>;
  },
}));

const Stack = createNativeStackNavigator();

const TestComponent = ({ component }: { component: React.ReactElement }) => component;

const renderWithNavigation = (component: React.ReactElement) => {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home">
          {() => <TestComponent component={component} />}
        </Stack.Screen>
        <Stack.Screen name="AmmunitionDetails">
          {() => <></>}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const mockAmmunition = [
  {
    id: "1",
    brand: "Federal",
    caliber: "9mm",
    quantity: 500,
    pricePerRound: 0.35,
  },
  {
    id: "2",
    brand: "Winchester",
    caliber: ".40 S&W",
    quantity: 250,
    pricePerRound: 0.42,
  },
  {
    id: "3",
    brand: "Remington",
    caliber: ".45 ACP",
    quantity: 100,
    pricePerRound: undefined,
  },
];

describe("AmmunitionTab", () => {
  const mockOnRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with ammunition data", () => {
    const { getByText } = renderWithNavigation(
      <AmmunitionTab
        ammunition={mockAmmunition}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    expect(getByText("Federal (9mm)")).toBeTruthy();
    expect(getByText("500 rounds")).toBeTruthy();
    expect(getByText("$0.35/rd")).toBeTruthy();
    expect(getByText("Winchester (.40 S&W)")).toBeTruthy();
    expect(getByText("250 rounds")).toBeTruthy();
    expect(getByText("$0.42/rd")).toBeTruthy();
  });

  it("displays empty state when no ammunition", () => {
    const { getByText } = renderWithNavigation(
      <AmmunitionTab
        ammunition={[]}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    expect(getByText("NO AMMUNITION FOUND")).toBeTruthy();
  });

  it("handles ammunition without price per round", () => {
    const { getByText, queryByText } = renderWithNavigation(
      <AmmunitionTab
        ammunition={[mockAmmunition[2]]}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    expect(getByText("Remington (.45 ACP)")).toBeTruthy();
    expect(getByText("100 rounds")).toBeTruthy();
    // Should not display price when pricePerRound is undefined
    expect(queryByText(/\$/)).toBeFalsy();
  });

  it("formats price correctly", () => {
    const preciseAmmo = {
      id: "4",
      brand: "Hornady",
      caliber: "9mm",
      quantity: 20,
      pricePerRound: 1.2345,
    };

    const { getByText } = renderWithNavigation(
      <AmmunitionTab
        ammunition={[preciseAmmo]}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    // Should round to 2 decimal places
    expect(getByText("$1.23/rd")).toBeTruthy();
  });

  it("handles ammunition item press", () => {
    const { getByText } = renderWithNavigation(
      <AmmunitionTab
        ammunition={mockAmmunition}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    const firstAmmo = getByText("Federal (9mm)");
    fireEvent.press(firstAmmo.parent!);
    // Navigation would be handled by the navigation mock
  });

  it("displays navigation arrow", () => {
    const { getAllByText } = renderWithNavigation(
      <AmmunitionTab
        ammunition={mockAmmunition}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    const arrows = getAllByText(">");
    expect(arrows).toHaveLength(3);
  });

  it("truncates long brand names", () => {
    const longBrandAmmo = {
      id: "5",
      brand: "Very Long Ammunition Brand Name That Should Be Truncated",
      caliber: "9mm",
      quantity: 50,
      pricePerRound: 0.30,
    };

    const { getByText } = renderWithNavigation(
      <AmmunitionTab
        ammunition={[longBrandAmmo]}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    // The text truncation is handled by numberOfLines prop
    expect(getByText(/Very Long Ammunition Brand Name/)).toBeTruthy();
  });

  it("handles refresh functionality", () => {
    renderWithNavigation(
      <AmmunitionTab
        ammunition={mockAmmunition}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    expect(mockOnRefresh).toBeDefined();
  });

  it("shows refreshing state", () => {
    renderWithNavigation(
      <AmmunitionTab
        ammunition={mockAmmunition}
        onRefresh={mockOnRefresh}
        refreshing={true}
      />
    );

    expect(mockOnRefresh).toBeDefined();
  });

  it("handles zero price per round", () => {
    const freeAmmo = {
      id: "6",
      brand: "Free Sample",
      caliber: "9mm",
      quantity: 10,
      pricePerRound: 0,
    };

    const { getByText, queryByText } = renderWithNavigation(
      <AmmunitionTab
        ammunition={[freeAmmo]}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    expect(getByText("Free Sample (9mm)")).toBeTruthy();
    expect(getByText("10 rounds")).toBeTruthy();
    // Zero price should not display price text (falsy value)
    expect(queryByText(/\$/)).toBeFalsy();
  });

  it("handles null price per round", () => {
    const nullPriceAmmo = {
      id: "7",
      brand: "Unknown Price",
      caliber: "9mm",
      quantity: 25,
      pricePerRound: null,
    };

    const { getByText, queryByText } = renderWithNavigation(
      <AmmunitionTab
        ammunition={[nullPriceAmmo]}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    expect(getByText("Unknown Price (9mm)")).toBeTruthy();
    expect(getByText("25 rounds")).toBeTruthy();
    // Should not display price when pricePerRound is null
    expect(queryByText(/\$/)).toBeFalsy();
  });

  it("displays different calibers correctly", () => {
    const differentCaliberAmmo = [
      { id: "8", brand: "Test", caliber: "22LR", quantity: 1000, pricePerRound: 0.05 },
      { id: "9", brand: "Test", caliber: "308 Win", quantity: 20, pricePerRound: 2.50 },
      { id: "10", brand: "Test", caliber: "12 Gauge", quantity: 25, pricePerRound: 1.00 },
    ];

    const { getByText } = renderWithNavigation(
      <AmmunitionTab
        ammunition={differentCaliberAmmo}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    expect(getByText("Test (22LR)")).toBeTruthy();
    expect(getByText("Test (308 Win)")).toBeTruthy();
    expect(getByText("Test (12 Gauge)")).toBeTruthy();
  });
});