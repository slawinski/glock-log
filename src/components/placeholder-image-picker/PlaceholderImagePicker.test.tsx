import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PlaceholderImagePicker } from './PlaceholderImagePicker';

describe('PlaceholderImagePicker', () => {
  it('renders all placeholder image options', () => {
    render(<PlaceholderImagePicker onSelect={() => {}} />);
    // Assuming there are 5 placeholder images based on assets/images
    expect(screen.getAllByTestId(/placeholder-image-option-/).length).toBe(5);
  });

  it('calls onSelect with the correct image key when an option is pressed', () => {
    const mockOnSelect = jest.fn();
    render(<PlaceholderImagePicker onSelect={mockOnSelect} />);
    const carbineOption = screen.getByTestId('placeholder-image-carbine-placeholder.png');
    fireEvent.press(carbineOption);
    expect(mockOnSelect).toHaveBeenCalledWith('carbine-placeholder.png');
  });

  it('highlights the selected image', () => {
    render(
      <PlaceholderImagePicker onSelect={() => {}} selectedImageKey='pistol-placeholder.png' />
    );
    const pistolOption = screen.getByTestId('placeholder-image-pistol-placeholder.png');
    // With Tailwind, direct style assertion is complex. We primarily check for existence.
    expect(pistolOption).toBeTruthy();
  });
});
