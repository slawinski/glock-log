import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { AccessoryListItem } from "./AccessoryListItem";
import {
  AccessoryImage,
  ACCESSORY_IMAGE_ASSETS,
} from "../../components/accessory-image";
import { AccessoryStorage } from "../../validation/storageSchemas";

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
  category: "scope",
  manufacturer: "Test Brand",
  modelName: "Test Optic",
  initialRounds: 0,
  status: "active",
  mountHistory: [],
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

describe("AccessoryListItem", () => {
  it("shows category artwork while preserving row text, accessibility and presses", () => {
    const onPress = jest.fn();
    const { getByText, getByTestId, getByRole } = render(
      <AccessoryListItem
        accessory={accessory}
        totalExposure={1234}
        currentFirearmName="Test Rifle"
        onPress={onPress}
      />
    );

    expect(getByText("SCOPE")).toBeTruthy();
    expect(getByText("Test Brand Test Optic")).toBeTruthy();
    expect(getByText("Test Rifle")).toBeTruthy();
    expect(getByText("1,234 RDS")).toBeTruthy();
    expect(getByRole("button", { name: "Test Brand Test Optic" })).toBeTruthy();
    expect(getByTestId("accessory-image-accessory-1-image").props.source).toBe(
      ACCESSORY_IMAGE_ASSETS.scope
    );
    fireEvent.press(getByTestId("accessory-list-item-accessory-1"));
    expect(onPress).toHaveBeenCalledWith("accessory-1");
  });

  it("uses the first photo as a cover thumbnail and retains unmounted text", () => {
    const { getByText, getByTestId } = render(
      <AccessoryListItem
        accessory={{
          ...accessory,
          manufacturer: undefined,
          photos: ["first.jpg", "second.jpg"],
        }}
        totalExposure={0}
        currentFirearmName={null}
        onPress={jest.fn()}
      />
    );

    expect(getByText("Test Optic")).toBeTruthy();
    expect(getByText("NOT MOUNTED")).toBeTruthy();
    expect(getByText("0 RDS")).toBeTruthy();
    const image = getByTestId("accessory-image-accessory-1-image");
    expect(image.props.source).toEqual({ uri: "first.jpg" });
    expect(image.props.contentFit).toBe("cover");
  });

  it("updates the category artwork when a memoized row receives updated data", () => {
    const props = {
      accessory,
      totalExposure: 0,
      currentFirearmName: null,
      onPress: jest.fn(),
    };
    const { rerender, UNSAFE_getByType } = render(<AccessoryListItem {...props} />);

    rerender(
      <AccessoryListItem
        {...props}
        accessory={{ ...accessory, category: "laser", photos: [] }}
      />
    );

    expect(UNSAFE_getByType(AccessoryImage).props.category).toBe("laser");
    expect(UNSAFE_getByType(AccessoryImage).props.photoUri).toBeUndefined();
  });
});
