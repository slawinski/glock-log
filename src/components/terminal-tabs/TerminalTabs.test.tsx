import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { TerminalTabs } from './TerminalTabs';

describe('TerminalTabs', () => {
  const mockTabs = [
    { id: 'tab1', title: 'Tab One' },
    { id: 'tab2', title: 'Tab Two' },
    { id: 'tab3', title: 'Tab Three' },
  ];
  const mockOnTabPress = jest.fn();

  it('renders all provided tabs', () => {
    render(<TerminalTabs tabs={mockTabs} activeTab='tab1' onTabPress={mockOnTabPress} />);
    expect(screen.getByText('Tab One')).toBeTruthy();
    expect(screen.getByText('Tab Two')).toBeTruthy();
    expect(screen.getByText('Tab Three')).toBeTruthy();
  });

  it('highlights the active tab', () => {
    render(<TerminalTabs tabs={mockTabs} activeTab='tab2' onTabPress={mockOnTabPress} />);
    const activeTabText = screen.getByTestId('active-tab-text');
    expect(activeTabText).toBeTruthy();
    expect(screen.getByText('Tab Two')).toBeTruthy();
  });

  it('calls onTabPress with the correct tab id when a tab is pressed', () => {
    render(<TerminalTabs tabs={mockTabs} activeTab='tab1' onTabPress={mockOnTabPress} />);
    const tab2 = screen.getByText('Tab Two');
    fireEvent.press(tab2);
    expect(mockOnTabPress).toHaveBeenCalledWith('tab2');
  });
});
