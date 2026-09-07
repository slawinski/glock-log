import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { PlaceholderImagePicker } from "./PlaceholderImagePicker";
import { ammunitionPlaceholderImages } from "../../services/image-source-manager";

describe("PlaceholderImagePicker", () => {
  it("renders all placeholder image options", () => {
    render(
      <PlaceholderImagePicker
        images={ammunitionPlaceholderImages}
        onSelect={() => {}}
      />
    );
    // There are 6 ammunition placeholder images.
    expect(screen.getAllByTestId(/placeholder-image-option-/).length).toBe(6);
  });

  it("calls onSelect with the correct image key when an option is pressed", () => {
    const mockOnSelect = jest.fn();
    render(
      <PlaceholderImagePicker
        images={ammunitionPlaceholderImages}
        onSelect={mockOnSelect}
      />
    );
    const option = screen.getByTestId("placeholder-image-22-placeholder.png");
    fireEvent.press(option);
    expect(mockOnSelect).toHaveBeenCalledWith("22-placeholder.png");
  });

  it("highlights the selected image", () => {
    render(
      <PlaceholderImagePicker
        images={ammunitionPlaceholderImages}
        onSelect={() => {}}
        selectedImageKey="22-placeholder.png"
      />
    );
    const option = screen.getByTestId("placeholder-image-22-placeholder.png");
    expect(option).toBeTruthy();
  });
});
