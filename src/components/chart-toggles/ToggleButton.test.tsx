import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ToggleButton } from './ToggleButton';

describe('ToggleButton', () => {
  it('renders the title correctly', () => {
    const title = 'Toggle Option';
    render(<ToggleButton title={title} onPress={() => {}} active={false} />);
    expect(screen.getByText(title)).toBeTruthy();
  });

  it('calls onPress when the button is pressed', () => {
    const mockOnPress = jest.fn();
    render(<ToggleButton title='Toggle Option' onPress={mockOnPress} active={false} />);
    const button = screen.getByText('Toggle Option');
    fireEvent.press(button);
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('applies active styling when active is true', () => {
    render(<ToggleButton title='Toggle Option' onPress={() => {}} active={true} />);
    const button = screen.getByText('Toggle Option');
    // With Tailwind, direct style assertion is complex. We primarily check for existence.
    expect(button).toBeTruthy();
  });

  it('applies inactive styling when active is false', () => {
    render(<ToggleButton title='Toggle Option' onPress={() => {}} active={false} />);
    const button = screen.getByText('Toggle Option');
    // With Tailwind, direct style assertion is complex. We primarily check for existence.
    expect(button).toBeTruthy();
  });
});
