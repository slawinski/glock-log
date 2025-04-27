import React from "react";
import { render } from "@testing-library/react-native";
import FirearmImage from "../FirearmImage";

describe("FirearmImage", () => {
  it("renders with default props", () => {
    const { getByTestId } = render(<FirearmImage testID="firearm-image" />);
    const image = getByTestId("firearm-image-image");
    expect(image).toBeTruthy();
  });

  it("renders with custom size", () => {
    const size = 100;
    const { getByTestId } = render(
      <FirearmImage size={size} testID="firearm-image" />
    );
    const image = getByTestId("firearm-image-image");
    expect(image.props.style).toHaveProperty("width", size * 0.9);
    expect(image.props.style).toHaveProperty("height", size * 0.9);
  });

  it("renders with photoUri", () => {
    const photoUri = "https://example.com/image.jpg";
    const { getByTestId } = render(
      <FirearmImage photoUri={photoUri} testID="firearm-image" />
    );
    const image = getByTestId("firearm-image-image");
    expect(image.props.source).toEqual({ uri: photoUri });
  });

  it("applies custom className", () => {
    const customClass = "custom-class";
    const { getByTestId } = render(
      <FirearmImage className={customClass} testID="firearm-container" />
    );
    const container = getByTestId("firearm-container");
    expect(container.props.className).toContain(customClass);
  });
});
