import React from "react";
import { render } from "@testing-library/react-native";
import { TerminalText } from "../terminal-text/TerminalText";

describe("TerminalText", () => {
  it("renders children correctly", () => {
    const { getByText } = render(<TerminalText>Test Text</TerminalText>);
    expect(getByText("Test Text")).toBeTruthy();
  });

  it("applies default className correctly", () => {
    const { getByText } = render(<TerminalText>Test Text</TerminalText>);
    const textElement = getByText("Test Text");
    expect(textElement.props.className).toContain("text-terminal-text");
    expect(textElement.props.className).toContain("font-terminal");
  });

  it("applies custom className correctly", () => {
    const customClass = "custom-class";
    const { getByText } = render(
      <TerminalText className={customClass}>Test Text</TerminalText>
    );
    const textElement = getByText("Test Text");
    expect(textElement.props.className).toContain(customClass);
    expect(textElement.props.className).toContain("text-terminal-text");
    expect(textElement.props.className).toContain("font-terminal");
  });
});
