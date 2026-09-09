import React from "react";
import { render } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AccessoryDetails } from "./AccessoryDetails";
import { AccessoryImage, ImageGallery, MetricHero } from "../../components";
import { storage } from "../../services";
import { AccessoryStorage } from "../../validation/storageSchemas";

jest.mock("../../services/storage-new");

jest.mock("expo-image", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    Image: (props: React.ComponentProps<typeof View>) =>
      React.createElement(View, props),
  };
});

const accessory: AccessoryStorage = {
  id: "accessory-1",
  category: "red_dot",
  modelName: "Test Optic",
  initialRounds: 250,
  status: "active",
  mountHistory: [],
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

const Stack = createNativeStackNavigator();

const renderScreen = () =>
  render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="AccessoryDetails"
          component={AccessoryDetails}
          initialParams={{ id: accessory.id }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );

describe("AccessoryDetails images", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(storage.getAccessories).mockResolvedValue([accessory]);
    jest.mocked(storage.getFirearms).mockResolvedValue([]);
    jest.mocked(storage.getRangeVisits).mockResolvedValue([]);
  });

  it.each([undefined, [], [""]])(
    "shows larger category artwork before metrics for photos=%p",
    async (photos) => {
      jest.mocked(storage.getAccessories).mockResolvedValue([{ ...accessory, photos }]);
      const { findByTestId, queryByTestId, UNSAFE_getByType, getByText } = renderScreen();

      await findByTestId("accessory-artwork");

      const artwork = UNSAFE_getByType(AccessoryImage);
      expect(artwork.props.category).toBe("red_dot");
      expect(artwork.props.size).toBe(220);
      expect(artwork.props.photoUri).toBeUndefined();
      expect(queryByTestId("gallery-image")).toBeNull();
      const sections = UNSAFE_getByType(AccessoryDetails).findAll(
        (node: { type: unknown }) =>
          node.type === AccessoryImage || node.type === MetricHero
      );
      expect(sections.map((node: { type: unknown }) => node.type)).toEqual([
        AccessoryImage,
        MetricHero,
      ]);
      expect(getByText("rounds exposure")).toBeTruthy();
      expect(getByText("Edit accessory")).toBeTruthy();
    }
  );

  it("shows every photo in order in the large gallery instead of artwork", async () => {
    const photos = ["first.jpg", "second.jpg", "third.jpg"];
    jest.mocked(storage.getAccessories).mockResolvedValue([{ ...accessory, photos }]);
    const { findAllByTestId, queryByTestId, UNSAFE_getByType } = renderScreen();

    expect(await findAllByTestId("gallery-image")).toHaveLength(3);
    const gallery = UNSAFE_getByType(ImageGallery);
    expect(gallery.props.images).toEqual(photos);
    expect(gallery.props.size).toBe("large");
    expect(gallery.props.showDeleteButton).toBe(false);
    expect(queryByTestId("accessory-artwork")).toBeNull();
    const sections = UNSAFE_getByType(AccessoryDetails).findAll(
      (node: { type: unknown }) =>
        node.type === ImageGallery || node.type === MetricHero
    );
    expect(sections.map((node: { type: unknown }) => node.type)).toEqual([
      ImageGallery,
      MetricHero,
    ]);
  });
});
