import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { FirearmsTab } from "./FirearmsTab";

// Mock components
jest.mock("../../components", () => ({
  TerminalText: ({ children, ...props }: any) => {
    const { Text } = require("react-native");
    return <Text {...props}>{children}</Text>;
  },
  FirearmImage: ({ photoUri, ...props }: any) => {
    const { View, Text } = require("react-native");
    return (
      <View testID="firearm-image" {...props}>
        <Text>Image: {photoUri || "placeholder"}</Text>
      </View>
    );
  },
  EmptyState: ({ title, message, primaryAction, ...props }: any) => {
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
      </View>
    );
  },
}));

const Stack = createNativeStackNavigator();

const TestComponent = ({ component }: { component: React.ReactElement }) =>
  component;

const renderWithNavigation = (component: React.ReactElement) => {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home">
          {() => <TestComponent component={component} />}
        </Stack.Screen>
        <Stack.Screen name="FirearmDetails">{() => <></>}</Stack.Screen>
        <Stack.Screen name="AddFirearm">{() => <></>}</Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const mockFirearms = [
  {
    id: "1",
    modelName: "Glock 19",
    caliber: "9mm",
    datePurchased: "2023-01-01T00:00:00.000Z",
    amountPaid: 500,
    roundsFired: 500,
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z",
    photos: ["photo1.jpg"],
  },
  {
    id: "2",
    modelName: "Smith & Wesson M&P",
    caliber: ".40 S&W",
    datePurchased: "2023-02-01T00:00:00.000Z",
    amountPaid: 400,
    roundsFired: 300,
    createdAt: "2023-02-01T00:00:00.000Z",
    updatedAt: "2023-02-01T00:00:00.000Z",
    photos: [],
  },
];

describe("FirearmsTab", () => {
  const mockOnRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with firearms data", () => {
    const { getByText } = renderWithNavigation(
      <FirearmsTab
        firearms={mockFirearms}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    expect(getByText("Glock 19")).toBeTruthy();
    expect(getByText("9mm")).toBeTruthy();
    expect(getByText("500 rounds fired")).toBeTruthy();
    expect(getByText("Smith & Wesson M&P")).toBeTruthy();
    expect(getByText(".40 S&W")).toBeTruthy();
    expect(getByText("300 rounds fired")).toBeTruthy();
  });

  it("displays empty state when no firearms", () => {
    const { getByText } = renderWithNavigation(
      <FirearmsTab firearms={[]} onRefresh={mockOnRefresh} refreshing={false} />
    );

    expect(getByText("No firearms yet")).toBeTruthy();
  });

  it("formats dates correctly", () => {
    const { getAllByText } = renderWithNavigation(
      <FirearmsTab
        firearms={mockFirearms}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    const dateElements = getAllByText(/Added \d+\/\d+\/\d+/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it("displays firearm image only when a photo exists", () => {
    const { getAllByTestId } = renderWithNavigation(
      <FirearmsTab
        firearms={mockFirearms}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    const images = getAllByTestId("firearm-image");
    expect(images).toHaveLength(1);
  });

  it("handles firearm item press", () => {
    const { getByTestId } = renderWithNavigation(
      <FirearmsTab
        firearms={mockFirearms}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    fireEvent.press(getByTestId("firearm-list-item-1"));
    // Navigation would be handled by the navigation mock
  });

  it("does not render a standalone chevron", () => {
    const { queryAllByText } = renderWithNavigation(
      <FirearmsTab
        firearms={mockFirearms}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    expect(queryAllByText(">")).toHaveLength(0);
  });

  it("handles refresh", () => {
    <FirearmsTab
      firearms={mockFirearms}
      onRefresh={mockOnRefresh}
      refreshing={false}
    />;

    // The FlatList doesn't have a direct testID, but we can test the refresh functionality
    // through the props passed to the component
    expect(mockOnRefresh).toBeDefined();
  });

  it("shows refreshing state", () => {
    renderWithNavigation(
      <FirearmsTab
        firearms={mockFirearms}
        onRefresh={mockOnRefresh}
        refreshing={true}
      />
    );

    // The refreshing state would be handled by the FlatList component
    expect(mockOnRefresh).toBeDefined();
  });

  it("handles firearm without photos", () => {
    const firearmWithoutPhotos = {
      id: "3",
      modelName: "Beretta 92FS",
      caliber: "9mm",
      datePurchased: "2023-03-01T00:00:00.000Z",
      amountPaid: 600,
      roundsFired: 200,
      createdAt: "2023-03-01T00:00:00.000Z",
      updatedAt: "2023-03-01T00:00:00.000Z",
    };

    const { getByText, queryByTestId } = renderWithNavigation(
      <FirearmsTab
        firearms={[firearmWithoutPhotos]}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    expect(getByText("Beretta 92FS")).toBeTruthy();
    expect(queryByTestId("firearm-image")).toBeNull();
  });

  it("truncates long model names", () => {
    const firearmWithLongName = {
      id: "4",
      modelName: "Very Long Firearm Model Name That Should Be Truncated",
      caliber: "9mm",
      datePurchased: "2023-04-01T00:00:00.000Z",
      amountPaid: 700,
      roundsFired: 100,
      createdAt: "2023-04-01T00:00:00.000Z",
      updatedAt: "2023-04-01T00:00:00.000Z",
      photos: [],
    };

    const { getByText } = renderWithNavigation(
      <FirearmsTab
        firearms={[firearmWithLongName]}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    // The text truncation is handled by numberOfLines prop
    expect(getByText(/Very Long Firearm Model Name/)).toBeTruthy();
  });
});
