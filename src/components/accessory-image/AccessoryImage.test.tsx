import React from "react";
import { render } from "@testing-library/react-native";
import { AccessoryImage, ACCESSORY_IMAGE_ASSETS } from "./index";
import { accessoryCategorySchema } from "../../validation/storageSchemas";
import { resolveImageSource } from "../../services/image-source-manager";

jest.mock("../../services/image-source-manager", () => ({
  resolveImageSource: jest.fn(),
}));

jest.mock("./accessoryImageAssets", () => ({
  ACCESSORY_IMAGE_ASSETS: {
    red_dot: 1,
    scope: 2,
    magnifier: 3,
    iron_sights: 4,
    flashlight: 5,
    laser: 6,
    suppressor: 7,
    bipod: 8,
    grip: 9,
    stock_brace: 10,
    sling: 11,
    mount_adapter: 12,
    other: 13,
  },
}));

jest.mock("expo-image", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    Image: (props: React.ComponentProps<typeof View>) =>
      React.createElement(View, props),
  };
});

describe("AccessoryImage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(resolveImageSource).mockReturnValue({ uri: "resolved-photo" });
  });

  it.each(accessoryCategorySchema.options)(
    "selects contained artwork for %s even with fill enabled",
    (category) => {
      const { getByTestId } = render(
        <AccessoryImage category={category} fill size={80} testID="accessory" />
      );

      const image = getByTestId("accessory-image");
      expect(image.props.source).toBe(ACCESSORY_IMAGE_ASSETS[category]);
      expect(image.props.contentFit).toBe("contain");
      expect(image.props.cachePolicy).toBe("disk");
      expect(image.props.style).toEqual({ width: 72, height: 72 });
      expect(resolveImageSource).not.toHaveBeenCalled();
    }
  );

  it("prefers the resolved photo over category artwork and fills the thumbnail", () => {
    const { getByTestId } = render(
      <AccessoryImage
        category="scope"
        photoUri="file:///old-container/images/photo.jpg"
        fill
        size={80}
        testID="accessory"
      />
    );

    expect(resolveImageSource).toHaveBeenCalledWith(
      "file:///old-container/images/photo.jpg"
    );
    const image = getByTestId("accessory-image");
    expect(image.props.source).toEqual({ uri: "resolved-photo" });
    expect(image.props.contentFit).toBe("cover");
    expect(image.props.cachePolicy).toBe("disk");
    expect(image.props.style).toEqual({ width: 80, height: 80 });
  });

  it("contains photos when fill is disabled", () => {
    const { getByTestId } = render(
      <AccessoryImage category="sling" photoUri="photo.jpg" testID="accessory" />
    );

    expect(getByTestId("accessory-image").props.contentFit).toBe("contain");
    expect(getByTestId("accessory").props.style).toEqual({
      width: 120,
      height: 120,
    });
  });

  it("uses larger artwork and treats an empty photo URI as absent", () => {
    const { getByTestId } = render(
      <AccessoryImage category="other" photoUri="" size={220} testID="accessory" />
    );

    expect(getByTestId("accessory").props.style).toEqual({
      width: 220,
      height: 220,
    });
    expect(getByTestId("accessory-image").props.source).toBe(
      ACCESSORY_IMAGE_ASSETS.other
    );
    expect(resolveImageSource).not.toHaveBeenCalled();
  });
});
