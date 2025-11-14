import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { TerminalCalendarHeader } from './TerminalCalendarHeader';

describe('TerminalCalendarHeader', () => {
  const mockOnPrevMonth = jest.fn();
  const mockOnNextMonth = jest.fn();

  beforeEach(() => {
    mockOnPrevMonth.mockClear();
    mockOnNextMonth.mockClear();
  });

  it('renders the current month and year', () => {
    const currentDate = new Date(2024, 0, 1);
    render(
      <TerminalCalendarHeader
        currentDate={currentDate}
        onPrevMonth={mockOnPrevMonth}
        onNextMonth={mockOnNextMonth}
      />
    );
    expect(screen.getByText('JANUARY 2024')).toBeTruthy();
  });

  it('calls onPrevMonth when the previous month button is pressed', () => {
    const currentDate = new Date(2024, 0, 1);
    render(
      <TerminalCalendarHeader
        currentDate={currentDate}
        onPrevMonth={mockOnPrevMonth}
        onNextMonth={mockOnNextMonth}
      />
    );
    const prevMonthButton = screen.getByTestId('prev-month-button');
    fireEvent.press(prevMonthButton);
    expect(mockOnPrevMonth).toHaveBeenCalledTimes(1);
  });

  it('calls onNextMonth when the next month button is pressed', () => {
    const currentDate = new Date(2024, 0, 1);
    render(
      <TerminalCalendarHeader
        currentDate={currentDate}
        onPrevMonth={mockOnPrevMonth}
        onNextMonth={mockOnNextMonth}
      />
    );
    const nextMonthButton = screen.getByTestId('next-month-button');
    fireEvent.press(nextMonthButton);
    expect(mockOnNextMonth).toHaveBeenCalledTimes(1);
  });
});
