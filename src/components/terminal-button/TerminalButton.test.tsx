import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { TerminalButton } from './TerminalButton';

describe('TerminalButton', () => {
  it('renders the caption correctly', () => {
    const caption = 'Click Me';
    render(<TerminalButton caption={caption} onPress={() => {}} />);
    expect(screen.getByText(caption)).toBeTruthy();
  });

  it('calls onPress when the button is pressed', () => {
    const mockOnPress = jest.fn();
    render(<TerminalButton caption='Click Me' onPress={mockOnPress} />);
    const button = screen.getByText('Click Me');
    fireEvent.press(button);
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    const mockOnPress = jest.fn();
    render(<TerminalButton caption='Click Me' onPress={mockOnPress} disabled={true} />);
    const button = screen.getByTestId('terminal-button');
    fireEvent.press(button);
    expect(mockOnPress).not.toHaveBeenCalled();
    expect(button.props.accessibilityState.disabled).toBe(true);
  });

  it('applies custom className', () => {
    const caption = 'Click Me';
    const customClassName = 'bg-red-500';
    const { getByText } = render(<TerminalButton caption={caption} onPress={() => {}} className={customClassName} />);
    // Note: @testing-library/react-native does not directly expose className for assertion.
    // This test primarily ensures the prop is passed without crashing.
    expect(getByText(caption)).toBeTruthy();
  });
});
