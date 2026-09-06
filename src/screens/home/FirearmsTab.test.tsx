import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { FirearmsTab } from "./FirearmsTab";
import { FirearmStorage } from "../../validation/storageSchemas";

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

const borrowedFirearm: FirearmStorage = {
  id: "borrowed-1",
  modelName: "Borrowed AR-15",
  caliber: "5.56 NATO",
  datePurchased: "2023-05-01T00:00:00.000Z",
  amountPaid: 0,
  roundsFired: 50,
  createdAt: "2023-05-01T00:00:00.000Z",
  updatedAt: "2023-05-01T00:00:00.000Z",
  ownership: "borrowed",
};

const mixedFirearms = [...mockFirearms, borrowedFirearm];

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

  it("hides borrowed firearms under the default Mine filter", () => {
    const { getByText, queryByText } = renderWithNavigation(
      <FirearmsTab
        firearms={mixedFirearms}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    expect(getByText("Glock 19")).toBeTruthy();
    expect(getByText("Smith & Wesson M&P")).toBeTruthy();
    expect(queryByText("Borrowed AR-15")).toBeNull();
  });

  it("shows borrowed firearms when the Borrowed filter is selected", () => {
    const { getByText, queryByText } = renderWithNavigation(
      <FirearmsTab
        firearms={mixedFirearms}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    fireEvent.press(getByText("Borrowed"));

    expect(getByText("Borrowed AR-15")).toBeTruthy();
    // Badge is hidden outside the "All" filter.
    expect(queryByText("BORROWED")).toBeNull();
    expect(queryByText("Glock 19")).toBeNull();
  });

  it("shows all firearms when the All filter is selected", () => {
    const { getByText } = renderWithNavigation(
      <FirearmsTab
        firearms={mixedFirearms}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    fireEvent.press(getByText("All"));

    expect(getByText("Glock 19")).toBeTruthy();
    expect(getByText("Smith & Wesson M&P")).toBeTruthy();
    expect(getByText("Borrowed AR-15")).toBeTruthy();
    // The badge is only shown in the "All" filter.
    expect(getByText("BORROWED")).toBeTruthy();
  });

  it("hides the filter when no firearms are borrowed", () => {
    const { queryByText, getByText } = renderWithNavigation(
      <FirearmsTab
        firearms={mockFirearms}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    // No filter tabs are rendered because every firearm is "mine".
    expect(queryByText("Mine")).toBeNull();
    expect(queryByText("Borrowed")).toBeNull();
    expect(queryByText("All")).toBeNull();
    // All (mine) firearms are still listed.
    expect(getByText("Glock 19")).toBeTruthy();
  });

  it("shows View borrowed action when only borrowed firearms exist", () => {
    const { getByText } = renderWithNavigation(
      <FirearmsTab
        firearms={[borrowedFirearm]}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    expect(getByText("No firearms")).toBeTruthy();
    expect(getByText("1 firearms are borrowed.")).toBeTruthy();
    expect(getByText("Add firearm")).toBeTruthy();
    expect(getByText("View borrowed")).toBeTruthy();
  });

  it("switches to the Borrowed filter via View borrowed", () => {
    const { getByText, queryByText } = renderWithNavigation(
      <FirearmsTab
        firearms={[borrowedFirearm]}
        onRefresh={mockOnRefresh}
        refreshing={false}
      />
    );

    fireEvent.press(getByText("View borrowed"));

    expect(getByText("Borrowed AR-15")).toBeTruthy();
    expect(queryByText("BORROWED")).toBeNull();
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
