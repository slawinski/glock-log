import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { TerminalDirectory } from './TerminalDirectory';

describe('TerminalDirectory', () => {
  const mockItems = [
    { label: 'Item 1', onPress: jest.fn() },
    { label: 'Item 2', onPress: jest.fn() },
    { label: 'Item 3', onPress: jest.fn() },
  ];

  beforeEach(() => {
    mockItems.forEach(item => item.onPress.mockClear());
  });

  it('renders the title correctly', () => {
    render(<TerminalDirectory title='TEST_DIRECTORY/' items={[]} />);
    expect(screen.getByText('TEST_DIRECTORY/')).toBeTruthy();
  });

  it('renders all provided items', () => {
    render(<TerminalDirectory title='TEST_DIRECTORY/' items={mockItems} />);
    expect(screen.getByText('├── Item 1')).toBeTruthy();
    expect(screen.getByText('├── Item 2')).toBeTruthy();
    expect(screen.getByText('└── Item 3')).toBeTruthy();
  });

  it('calls onPress when an item is pressed', () => {
    render(<TerminalDirectory title='TEST_DIRECTORY/' items={mockItems} />);
    const item1 = screen.getByText('├── Item 1');
    fireEvent.press(item1);
    expect(mockItems[0].onPress).toHaveBeenCalledTimes(1);
  });

  it('does not render items if the items array is empty', () => {
    render(<TerminalDirectory title='EMPTY_DIRECTORY/' items={[]} />);
    expect(screen.queryByText('Item 1')).toBeNull();
  });

  it('exposes button roles and labels to screen readers', () => {
    const itemsWithDisabled = [
      ...mockItems,
      { label: 'Disabled Item', onPress: jest.fn(), disabled: true },
    ];
    render(<TerminalDirectory title='TEST_DIRECTORY/' items={itemsWithDisabled} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
    expect(screen.getByLabelText('Item 1')).toBeTruthy();
    expect(
      screen.getByLabelText('Disabled Item').props.accessibilityState
    ).toEqual({ disabled: true });
  });
});
