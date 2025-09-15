import React from "react";
import { render } from "@testing-library/react-native";
import FirearmImage from "../firearm-image/FirearmImage";
import { resolveImageSource } from "../../services/image-source-manager";

// Mock the image source manager
jest.mock("../../services/image-source-manager", () => ({
  resolveImageSource: jest.fn(),
}));

const mockResolveImageSource = resolveImageSource as jest.MockedFunction<typeof resolveImageSource>;

describe("FirearmImage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders with default props", () => {
      mockResolveImageSource.mockReturnValue({ uri: "placeholder-image" });
      
      const { getByTestId } = render(<FirearmImage testID="firearm-image" />);
      const image = getByTestId("firearm-image-image");
      expect(image).toBeTruthy();
    });

    it("renders with default size when no size provided", () => {
      mockResolveImageSource.mockReturnValue({ uri: "placeholder-image" });
      
      const { getByTestId } = render(<FirearmImage testID="firearm-image" />);
      const container = getByTestId("firearm-image");
      const image = getByTestId("firearm-image-image");
      
      expect(container.props.style).toEqual({
        width: 120,
        height: 120,
      });
      expect(image.props.style).toHaveProperty("width", 108); // 120 * 0.9
      expect(image.props.style).toHaveProperty("height", 108); // 120 * 0.9
    });

    it("renders with custom size", () => {
      mockResolveImageSource.mockReturnValue({ uri: "placeholder-image" });
      
      const size = 100;
      const { getByTestId } = render(
        <FirearmImage size={size} testID="firearm-image" />
      );
      const container = getByTestId("firearm-image");
      const image = getByTestId("firearm-image-image");
      
      expect(container.props.style).toEqual({
        width: size,
        height: size,
      });
      expect(image.props.style).toHaveProperty("width", size * 0.9);
      expect(image.props.style).toHaveProperty("height", size * 0.9);
    });

    it("applies custom className", () => {
      mockResolveImageSource.mockReturnValue({ uri: "placeholder-image" });
      
      const customClass = "custom-class";
      const { getByTestId } = render(
        <FirearmImage className={customClass} testID="firearm-container" />
      );
      const container = getByTestId("firearm-container");
      expect(container.props.className).toContain(customClass);
      expect(container.props.className).toContain("justify-center items-center");
    });

    it("applies default className when none provided", () => {
      mockResolveImageSource.mockReturnValue({ uri: "placeholder-image" });
      
      const { getByTestId } = render(<FirearmImage testID="firearm-container" />);
      const container = getByTestId("firearm-container");
      expect(container.props.className).toBe("justify-center items-center ");
    });
  });

  describe("Image Source Resolution", () => {
    it("uses placeholder image when no photoUri provided", () => {
      const mockPlaceholderSource = { uri: "placeholder-pistol" };
      mockResolveImageSource.mockReturnValue(mockPlaceholderSource);
      
      const { getByTestId } = render(<FirearmImage testID="firearm-image" />);
      
      expect(mockResolveImageSource).toHaveBeenCalledWith("placeholder:pistol-placeholder.png");
      
      const image = getByTestId("firearm-image-image");
      expect(image.props.source).toEqual(mockPlaceholderSource);
    });

    it("uses custom photoUri when provided", () => {
      const photoUri = "https://example.com/image.jpg";
      const mockCustomSource = { uri: photoUri };
      mockResolveImageSource.mockReturnValue(mockCustomSource);
      
      const { getByTestId } = render(
        <FirearmImage photoUri={photoUri} testID="firearm-image" />
      );
      
      expect(mockResolveImageSource).toHaveBeenCalledWith(photoUri);
      
      const image = getByTestId("firearm-image-image");
      expect(image.props.source).toEqual(mockCustomSource);
    });

    it("calls resolveImageSource with correct placeholder format", () => {
      mockResolveImageSource.mockReturnValue({ uri: "placeholder" });
      
      render(<FirearmImage testID="firearm-image" />);
      
      expect(mockResolveImageSource).toHaveBeenCalledWith("placeholder:pistol-placeholder.png");
      expect(mockResolveImageSource).toHaveBeenCalledTimes(1);
    });

    it("handles local file URIs", () => {
      const localUri = "file:///path/to/local/image.jpg";
      const mockLocalSource = { uri: localUri };
      mockResolveImageSource.mockReturnValue(mockLocalSource);
      
      const { getByTestId } = render(
        <FirearmImage photoUri={localUri} testID="firearm-image" />
      );
      
      expect(mockResolveImageSource).toHaveBeenCalledWith(localUri);
      
      const image = getByTestId("firearm-image-image");
      expect(image.props.source).toEqual(mockLocalSource);
    });

    it("handles asset URIs", () => {
      const assetUri = "asset:/images/firearm.png";
      const mockAssetSource = { uri: assetUri };
      mockResolveImageSource.mockReturnValue(mockAssetSource);
      
      const { getByTestId } = render(
        <FirearmImage photoUri={assetUri} testID="firearm-image" />
      );
      
      expect(mockResolveImageSource).toHaveBeenCalledWith(assetUri);
      
      const image = getByTestId("firearm-image-image");
      expect(image.props.source).toEqual(mockAssetSource);
    });

    it("handles data URIs", () => {
      const dataUri = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JF";
      const mockDataSource = { uri: dataUri };
      mockResolveImageSource.mockReturnValue(mockDataSource);
      
      const { getByTestId } = render(
        <FirearmImage photoUri={dataUri} testID="firearm-image" />
      );
      
      expect(mockResolveImageSource).toHaveBeenCalledWith(dataUri);
      
      const image = getByTestId("firearm-image-image");
      expect(image.props.source).toEqual(mockDataSource);
    });
  });

  describe("Image Properties", () => {
    it("sets correct resizeMode on image", () => {
      mockResolveImageSource.mockReturnValue({ uri: "test-image" });
      
      const { getByTestId } = render(<FirearmImage testID="firearm-image" />);
      const image = getByTestId("firearm-image-image");
      
      expect(image.props.resizeMode).toBe("contain");
    });

    it("generates correct testID for image element", () => {
      mockResolveImageSource.mockReturnValue({ uri: "test-image" });
      
      const testID = "my-custom-test-id";
      const { getByTestId } = render(<FirearmImage testID={testID} />);
      
      expect(getByTestId(`${testID}-image`)).toBeTruthy();
    });

    it("handles undefined testID gracefully", () => {
      mockResolveImageSource.mockReturnValue({ uri: "test-image" });
      
      // Component should render without crashing when testID is undefined
      expect(() => render(<FirearmImage />)).not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty string photoUri", () => {
      const mockPlaceholderSource = { uri: "placeholder-pistol" };
      mockResolveImageSource.mockReturnValue(mockPlaceholderSource);
      
      const { getByTestId } = render(
        <FirearmImage photoUri="" testID="firearm-image" />
      );
      
      // Empty string is falsy, so should trigger placeholder logic
      expect(mockResolveImageSource).toHaveBeenCalledWith("placeholder:pistol-placeholder.png");
      
      const image = getByTestId("firearm-image-image");
      expect(image.props.source).toEqual(mockPlaceholderSource);
    });

    it("handles null photoUri", () => {
      const mockPlaceholderSource = { uri: "placeholder-pistol" };
      mockResolveImageSource.mockReturnValue(mockPlaceholderSource);
      
      const { getByTestId } = render(
        <FirearmImage photoUri={undefined} testID="firearm-image" />
      );
      
      // null should trigger placeholder logic
      expect(mockResolveImageSource).toHaveBeenCalledWith("placeholder:pistol-placeholder.png");
      
      const image = getByTestId("firearm-image-image");
      expect(image.props.source).toEqual(mockPlaceholderSource);
    });

    it("handles undefined photoUri", () => {
      const mockPlaceholderSource = { uri: "placeholder-pistol" };
      mockResolveImageSource.mockReturnValue(mockPlaceholderSource);
      
      const { getByTestId } = render(
        <FirearmImage photoUri={undefined} testID="firearm-image" />
      );
      
      // undefined should trigger placeholder logic
      expect(mockResolveImageSource).toHaveBeenCalledWith("placeholder:pistol-placeholder.png");
      
      const image = getByTestId("firearm-image-image");
      expect(image.props.source).toEqual(mockPlaceholderSource);
    });

    it("handles very large sizes", () => {
      mockResolveImageSource.mockReturnValue({ uri: "test-image" });
      
      const largeSize = 1000;
      const { getByTestId } = render(
        <FirearmImage size={largeSize} testID="firearm-image" />
      );
      
      const container = getByTestId("firearm-image");
      const image = getByTestId("firearm-image-image");
      
      expect(container.props.style).toEqual({
        width: largeSize,
        height: largeSize,
      });
      expect(image.props.style).toHaveProperty("width", largeSize * 0.9);
      expect(image.props.style).toHaveProperty("height", largeSize * 0.9);
    });

    it("handles zero size", () => {
      mockResolveImageSource.mockReturnValue({ uri: "test-image" });
      
      const zeroSize = 0;
      const { getByTestId } = render(
        <FirearmImage size={zeroSize} testID="firearm-image" />
      );
      
      const container = getByTestId("firearm-image");
      const image = getByTestId("firearm-image-image");
      
      expect(container.props.style).toEqual({
        width: zeroSize,
        height: zeroSize,
      });
      expect(image.props.style).toHaveProperty("width", 0);
      expect(image.props.style).toHaveProperty("height", 0);
    });

    it("handles negative size", () => {
      mockResolveImageSource.mockReturnValue({ uri: "test-image" });
      
      const negativeSize = -50;
      const { getByTestId } = render(
        <FirearmImage size={negativeSize} testID="firearm-image" />
      );
      
      const container = getByTestId("firearm-image");
      const image = getByTestId("firearm-image-image");
      
      expect(container.props.style).toEqual({
        width: negativeSize,
        height: negativeSize,
      });
      expect(image.props.style).toHaveProperty("width", negativeSize * 0.9);
      expect(image.props.style).toHaveProperty("height", negativeSize * 0.9);
    });
  });

  describe("Image Source Manager Integration", () => {
    it("handles when resolveImageSource returns object with additional properties", () => {
      const complexSource = {
        uri: "test-image",
        headers: { Authorization: "Bearer token" },
        cache: "force-cache",
      };
      mockResolveImageSource.mockReturnValue(complexSource);
      
      const { getByTestId } = render(<FirearmImage testID="firearm-image" />);
      const image = getByTestId("firearm-image-image");
      
      expect(image.props.source).toEqual(complexSource);
    });

    it("handles when resolveImageSource returns require() statement", () => {
      const requireSource = 12345; // Numeric value that require() returns
      mockResolveImageSource.mockReturnValue(requireSource);
      
      const { getByTestId } = render(<FirearmImage testID="firearm-image" />);
      const image = getByTestId("firearm-image-image");
      
      expect(image.props.source).toEqual(requireSource);
    });

    it("calls resolveImageSource exactly once per render", () => {
      mockResolveImageSource.mockReturnValue({ uri: "test-image" });
      
      const { rerender } = render(<FirearmImage testID="firearm-image" />);
      
      expect(mockResolveImageSource).toHaveBeenCalledTimes(1);
      
      // Re-render with same props
      rerender(<FirearmImage testID="firearm-image" />);
      
      expect(mockResolveImageSource).toHaveBeenCalledTimes(2);
    });

    it("calls resolveImageSource with updated photoUri on prop change", () => {
      mockResolveImageSource.mockReturnValue({ uri: "test-image" });
      
      const initialUri = "initial-image.jpg";
      const { rerender } = render(
        <FirearmImage photoUri={initialUri} testID="firearm-image" />
      );
      
      expect(mockResolveImageSource).toHaveBeenCalledWith(initialUri);
      
      const newUri = "new-image.jpg";
      rerender(<FirearmImage photoUri={newUri} testID="firearm-image" />);
      
      expect(mockResolveImageSource).toHaveBeenCalledWith(newUri);
      expect(mockResolveImageSource).toHaveBeenCalledTimes(2);
    });
  });
});
