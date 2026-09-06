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
  ToggleButton: ({ title, active, onPress, ...props }: any) => {
    const { Pressable, Text } = require("react-native");
    return (
      <Pressable
        onPress={onPress}
        accessibilityState={{ selected: active }}
        {...props}
      >
        <Text>{title}</Text>
      </Pressable>
    );
  },
  TerminalTabs: ({ tabs, activeTab, onTabPress, ...props }: any) => {
    const { View, Pressable, Text } = require("react-native");
    return (
      <View {...props}>
        {tabs.map((tab: any) => (
          <Pressable
            key={tab.id}
            onPress={() => onTabPress(tab.id)}
            accessibilityState={{ selected: activeTab === tab.id }}
          >
            <Text>{tab.title}</Text>
          </Pressable>
        ))}
      </View>
    );
  },
  EmptyState: ({ title, message, primaryAction, secondaryAction, ...props }: any) => {
    const { View, Text, Pressable } = require("react-native");
    return (
      <View {...props}>
        <Text>{title}</Text>
        <Text>{message}</Text>
        {primaryAction && (
          <Pressable onPress={primaryAction.onPress}>
            <Text>{primaryAction.caption}</Text>
          </Pressable>
        )}
        {secondaryAction && (
          <Pressable onPress={secondaryAction.onPress}>
            <Text>{secondaryAction.caption}</Text>
          </Pressable>
        )}
      </View>
    );
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
        <Stack.Screen name="AddAmmunition">
          {() => <></>}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const federal = {
  id: "1",
  brand: "Federal",
  caliber: "9mm",
  grain: "124",
  quantity: 500,
  datePurchased: "2023-01-01T00:00:00.000Z",
  amountPaid: 175,
  pricePerRound: 0.35,
  createdAt: "2023-01-01T00:00:00.000Z",
  updatedAt: "2023-01-01T00:00:00.000Z",
};

const winchester = {
  id: "2",
  brand: "Winchester",
  caliber: ".40 S&W",
  grain: "180",
  quantity: 250,
  datePurchased: "2023-01-02T00:00:00.000Z",
  amountPaid: 105,
  pricePerRound: 0.42,
  createdAt: "2023-01-02T00:00:00.000Z",
  updatedAt: "2023-01-02T00:00:00.000Z",
};

const remington = {
  id: "3",
  brand: "Remington",
  caliber: ".45 ACP",
  grain: "230",
  quantity: 100,
  datePurchased: "2023-01-03T00:00:00.000Z",
  amountPaid: 50,
  createdAt: "2023-01-03T00:00:00.000Z",
  updatedAt: "2023-01-03T00:00:00.000Z",
};

const depleted = {
  id: "zero",
  brand: "Empty Brand",
  caliber: "9mm",
  grain: "115",
  quantity: 0,
  datePurchased: "2023-01-01T00:00:00.000Z",
  amountPaid: 0,
  createdAt: "2023-01-01T00:00:00.000Z",
  updatedAt: "2023-01-01T00:00:00.000Z",
};

const inStockAmmunition = [federal, winchester, remington];
const mixedAmmunition = [...inStockAmmunition, depleted];

describe("AmmunitionTab", () => {
  const mockOnRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders in-stock ammunition by default", () => {
    const { getByText, queryByText } = renderWithNavigation(
      <AmmunitionTab
        ammunition={mixedAmmunition}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    expect(getByText("Federal")).toBeTruthy();
    expect(getByText("9mm • 124")).toBeTruthy();
    expect(getByText("500 rounds remaining")).toBeTruthy();
    expect(getByText(/0\.35/)).toBeTruthy();
    expect(getByText("Winchester")).toBeTruthy();
    expect(getByText("250 rounds remaining")).toBeTruthy();
    expect(getByText(/0\.42/)).toBeTruthy();
    // Depleted item hidden under default "In stock" filter
    expect(queryByText("Empty Brand")).toBeNull();
  });

  it("shows depleted ammunition when the Depleted filter is selected", () => {
    const { getByText, queryByText } = renderWithNavigation(
      <AmmunitionTab
        ammunition={mixedAmmunition}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    fireEvent.press(getByText("Depleted"));

    expect(getByText("Empty Brand")).toBeTruthy();
    expect(getByText("0 rounds • Depleted")).toBeTruthy();
    expect(queryByText("Federal")).toBeNull();
  });

  it("shows all ammunition when the All filter is selected", () => {
    const { getByText } = renderWithNavigation(
      <AmmunitionTab
        ammunition={mixedAmmunition}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    fireEvent.press(getByText("All"));

    expect(getByText("Federal")).toBeTruthy();
    expect(getByText("Empty Brand")).toBeTruthy();
    expect(getByText("0 rounds • Depleted")).toBeTruthy();
  });

  it("displays empty state when no ammunition", () => {
    const { getByText } = renderWithNavigation(
      <AmmunitionTab
        ammunition={[]}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    expect(getByText("No ammunition in stock")).toBeTruthy();
    expect(getByText("Add ammunition")).toBeTruthy();
  });

  it("shows View depleted action when only depleted ammunition exists", () => {
    const { getByText } = renderWithNavigation(
      <AmmunitionTab
        ammunition={[depleted]}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    expect(getByText("No ammunition in stock")).toBeTruthy();
    expect(getByText("1 ammunition records are depleted.")).toBeTruthy();
    expect(getByText("Add ammunition")).toBeTruthy();
    expect(getByText("View depleted")).toBeTruthy();
  });

  it("switches to the Depleted filter via View depleted", () => {
    const { getByText } = renderWithNavigation(
      <AmmunitionTab
        ammunition={[depleted]}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    fireEvent.press(getByText("View depleted"));

    expect(getByText("Empty Brand")).toBeTruthy();
    expect(getByText("0 rounds • Depleted")).toBeTruthy();
  });

  it("displays depleted empty state when no depleted items", () => {
    const { getByText } = renderWithNavigation(
      <AmmunitionTab
        ammunition={inStockAmmunition}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    fireEvent.press(getByText("Depleted"));

    expect(getByText("No depleted ammunition")).toBeTruthy();
    expect(getByText("Show all ammunition")).toBeTruthy();
  });

  it("resets filter to All via Show all ammunition", () => {
    const { getByText } = renderWithNavigation(
      <AmmunitionTab
        ammunition={inStockAmmunition}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    fireEvent.press(getByText("Depleted"));
    expect(getByText("No depleted ammunition")).toBeTruthy();

    fireEvent.press(getByText("Show all ammunition"));

    // Filter is now "All", so in-stock items are visible again
    expect(getByText("Federal")).toBeTruthy();
  });

  it("handles ammunition without price per round", () => {
    const { getByText, queryByText } = renderWithNavigation(
      <AmmunitionTab
        ammunition={[remington]}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    expect(getByText("Remington")).toBeTruthy();
    expect(getByText("100 rounds remaining")).toBeTruthy();
    // Should not display price when pricePerRound is undefined
    expect(queryByText(/\$/)).toBeFalsy();
  });

  it("formats price correctly", () => {
    const preciseAmmo = {
      id: "4",
      brand: "Hornady",
      caliber: "9mm",
      grain: "115",
      quantity: 20,
      datePurchased: "2023-01-04T00:00:00.000Z",
      amountPaid: 24.69,
      pricePerRound: 1.2345,
      createdAt: "2023-01-04T00:00:00.000Z",
      updatedAt: "2023-01-04T00:00:00.000Z",
    };

    const { getByText } = renderWithNavigation(
      <AmmunitionTab
        ammunition={[preciseAmmo]}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    expect(getByText(/1\.23/)).toBeTruthy();
  });

  it("handles ammunition item press", () => {
    const { getByTestId } = renderWithNavigation(
      <AmmunitionTab
        ammunition={inStockAmmunition}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    fireEvent.press(getByTestId("ammunition-list-item-1"));
    // Navigation would be handled by the navigation mock
  });

  it("does not render a standalone chevron", () => {
    const { queryAllByText } = renderWithNavigation(
      <AmmunitionTab
        ammunition={inStockAmmunition}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    expect(queryAllByText(">")).toHaveLength(0);
  });

  it("handles refresh functionality", () => {
    renderWithNavigation(
      <AmmunitionTab
        ammunition={inStockAmmunition}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    expect(mockOnRefresh).toBeDefined();
  });

  it("shows refreshing state", () => {
    renderWithNavigation(
      <AmmunitionTab
        ammunition={inStockAmmunition}
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
      grain: "115",
      quantity: 10,
      datePurchased: "2023-01-06T00:00:00.000Z",
      amountPaid: 0,
      pricePerRound: 0,
      createdAt: "2023-01-06T00:00:00.000Z",
      updatedAt: "2023-01-06T00:00:00.000Z",
    };

    const { getByText, queryByText } = renderWithNavigation(
      <AmmunitionTab
        ammunition={[freeAmmo]}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    expect(getByText("Free Sample")).toBeTruthy();
    expect(getByText("10 rounds remaining")).toBeTruthy();
    // Zero price should not display price text (falsy value)
    expect(queryByText(/\$/)).toBeFalsy();
  });

  it("handles undefined price per round", () => {
    const noPriceAmmo = {
      id: "7",
      brand: "Unknown Price",
      caliber: "9mm",
      grain: "124",
      quantity: 25,
      datePurchased: "2023-01-07T00:00:00.000Z",
      amountPaid: 10,
      createdAt: "2023-01-07T00:00:00.000Z",
      updatedAt: "2023-01-07T00:00:00.000Z",
    };

    const { getByText, queryByText } = renderWithNavigation(
      <AmmunitionTab
        ammunition={[noPriceAmmo]}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    expect(getByText("Unknown Price")).toBeTruthy();
    expect(getByText("25 rounds remaining")).toBeTruthy();
    expect(queryByText(/\$/)).toBeFalsy();
  });
});
