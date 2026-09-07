import React from "react";
import { render } from "@testing-library/react-native";
import { FirearmImage } from "../firearm-image/FirearmImage";
import { resolveImageSource } from "../../services/image-source-manager";
import { FirearmArtwork } from "../../features/firearm-visuals";

// Mock the image source manager
jest.mock("../../services/image-source-manager", () => ({
  resolveImageSource: jest.fn(),
}));

// Mock the loadout-artwork renderer so tests assert on what FirearmImage
// passes down (firearmType / mountedAccessories / size) rather than the real
// layered-image renderer.
jest.mock("../../features/firearm-visuals", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    FirearmArtwork: jest.fn((props: any) =>
      React.createElement(View, { testID: props.testID }, props.children)
    ),
  };
});

// Mock expo-image's Image as a passthrough host component so tests assert on
// what FirearmImage passes down (source/contentFit/cachePolicy) rather than
// expo-image's internal source resolution.
jest.mock("expo-image", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    Image: (props: React.ComponentProps<typeof View>) =>
      React.createElement(View, props),
  };
});

const mockResolveImageSource = resolveImageSource as jest.MockedFunction<
  typeof resolveImageSource
>;
const mockFirearmArtwork = FirearmArtwork as jest.MockedFunction<
  typeof FirearmArtwork
>;

describe("FirearmImage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("photo rendering", () => {
    it("renders a photo and resolves its source when photoUri is provided", () => {
      mockResolveImageSource.mockReturnValue({ uri: "photo" });

      const { getByTestId } = render(
        <FirearmImage photoUri="https://example.com/a.jpg" testID="img" />
      );

      expect(mockResolveImageSource).toHaveBeenCalledWith(
        "https://example.com/a.jpg"
      );
      expect(getByTestId("img-image")).toBeTruthy();
      expect(mockFirearmArtwork).not.toHaveBeenCalled();
    });

    it("uses contain contentFit for a non-fill photo", () => {
      mockResolveImageSource.mockReturnValue({ uri: "photo" });

      const { getByTestId } = render(
        <FirearmImage photoUri="a.jpg" testID="img" />
      );

      expect(getByTestId("img-image").props.contentFit).toBe("contain");
    });

    it("uses cover contentFit and full size for a fill photo", () => {
      mockResolveImageSource.mockReturnValue({ uri: "photo" });

      const { getByTestId } = render(
        <FirearmImage photoUri="a.jpg" fill size={80} testID="img" />
      );

      const image = getByTestId("img-image");
      expect(image.props.contentFit).toBe("cover");
      expect(image.props.style).toEqual({ width: "100%", height: "100%" });
    });
  });

  describe("loadout artwork rendering", () => {
    it("renders artwork when no photoUri is provided", () => {
      const { getByTestId } = render(
        <FirearmImage testID="img" firearmType="rifle" />
      );

      expect(getByTestId("img-artwork")).toBeTruthy();
      expect(mockResolveImageSource).not.toHaveBeenCalled();
    });

    it("defaults the firearm type to other when absent", () => {
      render(<FirearmImage testID="img" />);

      expect(mockFirearmArtwork).toHaveBeenCalled();
      expect(mockFirearmArtwork.mock.calls[0][0].firearmType).toBe("other");
    });

    it("passes the firearm type and mounted accessories to the artwork", () => {
      const accessories: never[] = [];
      render(
        <FirearmImage
          testID="img"
          firearmType="pistol"
          mountedAccessories={accessories}
        />
      );

      expect(mockFirearmArtwork).toHaveBeenCalled();
      expect(mockFirearmArtwork.mock.calls[0][0].firearmType).toBe("pistol");
      expect(mockFirearmArtwork.mock.calls[0][0].mountedAccessories).toBe(
        accessories
      );
    });

    it("scales the artwork within the container", () => {
      render(<FirearmImage testID="img" size={100} firearmType="pistol" />);

      expect(mockFirearmArtwork.mock.calls[0][0].size).toBe(90);
    });
  });
});
