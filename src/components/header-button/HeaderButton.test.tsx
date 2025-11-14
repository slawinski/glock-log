import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { HeaderButton } from './HeaderButton';

describe('HeaderButton', () => {
  it('renders the caption correctly', () => {
    const caption = 'Test Caption';
    render(<HeaderButton caption={caption} onPress={() => {}} />);
    expect(screen.getByText(caption)).toBeTruthy();
  });

  it('calls onPress when the button is pressed', () => {
    const mockOnPress = jest.fn();
    render(<HeaderButton caption='Test Caption' onPress={mockOnPress} />);
    const button = screen.getByText('Test Caption');
    fireEvent.press(button);
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const caption = 'Test Caption';
    const customClassName = 'text-red-500';
    const { getByText } = render(<HeaderButton caption={caption} onPress={() => {}} className={customClassName} />);
    // Note: @testing-library/react-native does not directly expose className for assertion.
    // This test primarily ensures the prop is passed without crashing.
    expect(getByText(caption)).toBeTruthy();
  });
});
