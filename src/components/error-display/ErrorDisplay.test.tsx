import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ErrorDisplay } from './ErrorDisplay';

describe('ErrorDisplay', () => {
  it('renders the error message correctly', () => {
    const errorMessage = 'Test error message';
    render(<ErrorDisplay errorMessage={errorMessage} />);
    expect(screen.getByText(errorMessage)).toBeTruthy();
  });

  it('does not render a retry button if onRetry is not provided', () => {
    const errorMessage = 'Test error message';
    render(<ErrorDisplay errorMessage={errorMessage} />);
    expect(screen.queryByText('Retry')).toBeNull();
  });

  it('renders a retry button and calls onRetry when pressed', () => {
    const errorMessage = 'Test error message';
    const mockOnRetry = jest.fn();
    render(<ErrorDisplay errorMessage={errorMessage} onRetry={mockOnRetry} />);
    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeTruthy();
    fireEvent.press(retryButton);
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });
});
