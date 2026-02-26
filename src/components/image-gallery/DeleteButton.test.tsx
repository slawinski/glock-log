import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { DeleteButton } from './DeleteButton';

describe('DeleteButton', () => {
  const mockOnDelete = jest.fn();
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    mockOnDelete.mockClear();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      const deleteButton = buttons?.find((button: any) => button.text === 'Delete');
      if (deleteButton && deleteButton.onPress) {
        deleteButton.onPress();
      }
    });
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('renders the delete icon', () => {
    render(<DeleteButton onDelete={mockOnDelete} />);
    expect(screen.getByTestId('delete-icon')).toBeTruthy();
  });

  it('calls onDelete when the button is pressed and confirmed', () => {
    render(<DeleteButton onDelete={mockOnDelete} />);
    const button = screen.getByTestId('delete-icon');
    fireEvent.press(button);

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('does not call onDelete if the alert is cancelled', () => {
    alertSpy.mockImplementationOnce((_title, _message, buttons) => {
      const cancelButton = buttons?.find((button: any) => button.text === 'Cancel');
      if (cancelButton && cancelButton.onPress) {
        cancelButton.onPress();
      }
    });

    render(<DeleteButton onDelete={mockOnDelete} />);
    const button = screen.getByTestId('delete-icon');
    fireEvent.press(button);

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).not.toHaveBeenCalled();
  });
});
