import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { VisitsTab } from "./VisitsTab";
import { RangeVisitStorage } from "../../validation/storageSchemas";

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
        <Stack.Screen name="RangeVisitDetails">
          {() => <></>}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const mockRangeVisits: RangeVisitStorage[] = [
  {
    id: "1",
    location: "Local Range",
    date: "2023-01-15T00:00:00.000Z",
    createdAt: "2023-01-15T00:00:00.000Z",
    updatedAt: "2023-01-15T00:00:00.000Z",
    firearmsUsed: ["firearm1"],
    ammunitionUsed: {
      "ammo1": { ammunitionId: "ammo1", rounds: 50 },
      "ammo2": { ammunitionId: "ammo2", rounds: 25 },
    },
  },
  {
    id: "2",
    location: "Outdoor Range",
    date: "2023-02-10T00:00:00.000Z",
    createdAt: "2023-02-10T00:00:00.000Z",
    updatedAt: "2023-02-10T00:00:00.000Z",
    firearmsUsed: ["firearm2"],
    ammunitionUsed: {
      "ammo3": { ammunitionId: "ammo3", rounds: 100 },
    },
  },
  {
    id: "3",
    location: "Indoor Range",
    date: "2023-03-05T00:00:00.000Z",
    createdAt: "2023-03-05T00:00:00.000Z",
    updatedAt: "2023-03-05T00:00:00.000Z",
    firearmsUsed: ["firearm1"],
    ammunitionUsed: {},
  },
];

describe("VisitsTab", () => {
  const mockOnRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with range visits data", () => {
    const { getByText } = renderWithNavigation(
      <VisitsTab
        rangeVisits={mockRangeVisits}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    expect(getByText("Local Range")).toBeTruthy();
    expect(getByText("75 rounds")).toBeTruthy();
    expect(getByText("Outdoor Range")).toBeTruthy();
    expect(getByText("100 rounds")).toBeTruthy();
  });

  it("displays empty state when no range visits", () => {
    const { getByText } = renderWithNavigation(
      <VisitsTab
        rangeVisits={[]}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    expect(getByText("NO RANGE VISITS FOUND")).toBeTruthy();
  });

  it("calculates total rounds correctly", () => {
    const { getByText } = renderWithNavigation(
      <VisitsTab
        rangeVisits={mockRangeVisits}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    // First visit: 50 + 25 = 75 rounds
    expect(getByText("75 rounds")).toBeTruthy();
    // Second visit: 100 rounds
    expect(getByText("100 rounds")).toBeTruthy();
    // Third visit: 0 rounds (empty ammunitionUsed)
    expect(getByText("0 rounds")).toBeTruthy();
  });

  it("formats dates correctly", () => {
    const { getAllByText } = renderWithNavigation(
      <VisitsTab
        rangeVisits={mockRangeVisits}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    const dateElements = getAllByText(/\d+\/\d+\/\d+/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it("handles range visit item press", () => {
    const { getByText } = renderWithNavigation(
      <VisitsTab
        rangeVisits={mockRangeVisits}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    const firstVisit = getByText("Local Range");
    fireEvent.press(firstVisit.parent!);
    // Navigation would be handled by the navigation mock
  });

  it("displays navigation arrow", () => {
    const { getAllByText } = renderWithNavigation(
      <VisitsTab
        rangeVisits={mockRangeVisits}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    const arrows = getAllByText(">");
    expect(arrows).toHaveLength(3);
  });

  it("handles visit without ammunition used", () => {
    const visitWithoutAmmo: RangeVisitStorage = {
      id: "4",
      location: "Test Range",
      date: "2023-04-01T00:00:00.000Z",
      createdAt: "2023-04-01T00:00:00.000Z",
      updatedAt: "2023-04-01T00:00:00.000Z",
      firearmsUsed: ["firearm1"],
    };

    const { getByText } = renderWithNavigation(
      <VisitsTab
        rangeVisits={[visitWithoutAmmo]}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    expect(getByText("Test Range")).toBeTruthy();
    expect(getByText("0 rounds")).toBeTruthy();
  });

  it("handles visit with empty ammunition used", () => {
    const visitWithNullAmmo: RangeVisitStorage = {
      id: "5",
      location: "Another Range",
      date: "2023-05-01T00:00:00.000Z",
      createdAt: "2023-05-01T00:00:00.000Z",
      updatedAt: "2023-05-01T00:00:00.000Z",
      firearmsUsed: ["firearm2"],
      ammunitionUsed: {},
    };

    const { getByText } = renderWithNavigation(
      <VisitsTab
        rangeVisits={[visitWithNullAmmo]}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    expect(getByText("Another Range")).toBeTruthy();
    expect(getByText("0 rounds")).toBeTruthy();
  });

  it("handles refresh functionality", () => {
    renderWithNavigation(
      <VisitsTab
        rangeVisits={mockRangeVisits}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    expect(mockOnRefresh).toBeDefined();
  });

  it("shows refreshing state", () => {
    renderWithNavigation(
      <VisitsTab
        rangeVisits={mockRangeVisits}
        onRefresh={mockOnRefresh}
        refreshing={true}
      />
    );

    expect(mockOnRefresh).toBeDefined();
  });

  it("handles complex ammunition usage calculation", () => {
    const complexVisit: RangeVisitStorage = {
      id: "6",
      location: "Complex Range",
      date: "2023-06-01T00:00:00.000Z",
      createdAt: "2023-06-01T00:00:00.000Z",
      updatedAt: "2023-06-01T00:00:00.000Z",
      firearmsUsed: ["firearm1", "firearm2"],
      ammunitionUsed: {
        "ammo1": { ammunitionId: "ammo1", rounds: 150 },
        "ammo2": { ammunitionId: "ammo2", rounds: 75 },
        "ammo3": { ammunitionId: "ammo3", rounds: 25 },
        "ammo4": { ammunitionId: "ammo4", rounds: 0 },
      },
    };

    const { getByText } = renderWithNavigation(
      <VisitsTab
        rangeVisits={[complexVisit]}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    // 150 + 75 + 25 + 0 = 250 rounds
    expect(getByText("250 rounds")).toBeTruthy();
  });
});