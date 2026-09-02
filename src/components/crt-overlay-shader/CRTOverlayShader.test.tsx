import React from "react";
import { render } from "@testing-library/react-native";
import { Skia } from "@shopify/react-native-skia";
import { CRTOverlayShader } from "./CRTOverlayShader";

jest.mock("react-native-reanimated", () =>
  require("react-native-reanimated/mock")
);

describe("CRTOverlayShader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the CRT overlay when the shader compiles", () => {
    (Skia.RuntimeEffect.Make as jest.Mock).mockReturnValue({});

    const { UNSAFE_root } = render(<CRTOverlayShader />);

    expect(UNSAFE_root.findAllByType("Canvas" as never)).toHaveLength(1);
    expect(UNSAFE_root.findAllByType("BlurView" as never)).toHaveLength(1);
    expect(UNSAFE_root.findAllByType("Shader" as never)).toHaveLength(1);
  });

  it("falls back to null when the shader fails to compile", () => {
    (Skia.RuntimeEffect.Make as jest.Mock).mockReturnValue(null);

    const { toJSON } = render(<CRTOverlayShader />);

    expect(toJSON()).toBeNull();
  });
});
