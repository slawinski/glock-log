import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { FirearmsTab } from './FirearmsTab';
import { FirearmStorage, RangeVisitStorage } from '../../validation/storageSchemas';

describe('FirearmsTab', () => {
  const mockFirearms: FirearmStorage[] = [
    {
      id: 'firearm1',
      modelName: 'Glock 19',
      caliber: '9mm',
      roundsFired: 500,
      amountPaid: 600,
      datePurchased: '2023-01-01T00:00:00.000Z',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    },
    {
      id: 'firearm2',
      modelName: 'AR-15',
      caliber: '5.56',
      roundsFired: 1500,
      amountPaid: 1200,
      datePurchased: '2023-01-01T00:00:00.000Z',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    },
  ];

  const mockRangeVisits: RangeVisitStorage[] = [
    {
      id: 'visit1',
      date: '2023-01-15T00:00:00.000Z',
      location: 'Range A',
      firearmsUsed: ['firearm1', 'firearm2'],
      ammunitionUsed: { 'firearm1': { ammunitionId: 'ammo1', rounds: 50 } },
      createdAt: '2023-01-15T00:00:00.000Z',
      updatedAt: '2023-01-15T00:00:00.000Z',
    },
  ];

  const mockOnToggleFirearm = jest.fn();
  const mockOnToggleAllFirearms = jest.fn();

  it('renders firearm statistics correctly', () => {
    render(
      <FirearmsTab
        firearms={mockFirearms}
        rangeVisits={mockRangeVisits}
        visibleFirearms={new Set(['firearm1', 'firearm2'])}
        onToggleFirearm={mockOnToggleFirearm}
        onToggleAllFirearms={mockOnToggleAllFirearms}
        isAllSelected={true}
      />
    );

    expect(screen.getByText('TOTAL FIREARMS: ')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();

    expect(screen.getByText('TOTAL VALUE: ')).toBeTruthy();
    expect(screen.getByText('$1,800.00')).toBeTruthy();

    expect(screen.getByText('MOST COMMON CALIBER: ')).toBeTruthy();
    expect(screen.getByText('9mm')).toBeTruthy();

    expect(screen.getByText('MOST USED FIREARM: ')).toBeTruthy();
    expect(screen.getByText(/AR-15 \(1500 rounds\)/)).toBeTruthy();
  });

  it('renders empty state when no firearms are provided', () => {
    render(
      <FirearmsTab
        firearms={[]}
        rangeVisits={[]}
        visibleFirearms={new Set()}
        onToggleFirearm={mockOnToggleFirearm}
        onToggleAllFirearms={mockOnToggleAllFirearms}
        isAllSelected={false}
      />
    );
    expect(screen.getByText('NO FIREARM DATA')).toBeTruthy();
  });

  it('calls onToggleFirearm when a firearm is toggled', () => {
    render(
      <FirearmsTab
        firearms={mockFirearms}
        rangeVisits={mockRangeVisits}
        visibleFirearms={new Set(['firearm1', 'firearm2'])}
        onToggleFirearm={mockOnToggleFirearm}
        onToggleAllFirearms={mockOnToggleAllFirearms}
        isAllSelected={true}
      />
    );
    const glockToggle = screen.getByText('Glock 19');
    fireEvent.press(glockToggle);
    expect(mockOnToggleFirearm).toHaveBeenCalledWith('firearm1');
  });

  it('calls onToggleAllFirearms when the toggle all button is pressed', () => {
    render(
      <FirearmsTab
        firearms={mockFirearms}
        rangeVisits={mockRangeVisits}
        visibleFirearms={new Set(['firearm1', 'firearm2'])}
        onToggleFirearm={mockOnToggleFirearm}
        onToggleAllFirearms={mockOnToggleAllFirearms}
        isAllSelected={true}
      />
    );
    const toggleAllButton = screen.getByText('ALL');
    fireEvent.press(toggleAllButton);
    expect(mockOnToggleAllFirearms).toHaveBeenCalledTimes(1);
  });
});
