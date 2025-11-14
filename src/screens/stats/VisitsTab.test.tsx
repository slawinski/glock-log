import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { VisitsTab } from './VisitsTab';
import { RangeVisitStorage } from '../../validation/storageSchemas';

describe('VisitsTab', () => {
  const mockRangeVisits: RangeVisitStorage[] = [
    {
      id: 'visit1',
      date: '2023-01-01T00:00:00.000Z',
      location: 'Range A',
      firearmsUsed: ['firearm1'],
      ammunitionUsed: { 'firearm1': { ammunitionId: 'ammo1', rounds: 100 } },
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    },
    {
      id: 'visit2',
      date: '2023-01-15T00:00:00.000Z',
      location: 'Range B',
      firearmsUsed: ['firearm2'],
      ammunitionUsed: { 'firearm2': { ammunitionId: 'ammo2', rounds: 200 } },
      createdAt: '2023-01-15T00:00:00.000Z',
      updatedAt: '2023-01-15T00:00:00.000Z',
    },
  ];

  it('renders visit statistics correctly', () => {
    render(<VisitsTab rangeVisits={mockRangeVisits} />);

    expect(screen.getByText('TOTAL VISITS: ')).toBeTruthy();
    expect(screen.getByTestId('total-visits').props.children).toBe(2);

    expect(screen.getByText('TOTAL ROUNDS FIRED: ')).toBeTruthy();
    expect(screen.getByText('300')).toBeTruthy(); // 100 + 200

    expect(screen.getByText('MOST VISITED LOCATION: ')).toBeTruthy();
    expect(screen.getByText('Range A')).toBeTruthy(); // Assuming Range A is picked as most visited

    expect(screen.getByText('AVERAGE ROUNDS PER VISIT: ')).toBeTruthy();
    expect(screen.getByText('150.0')).toBeTruthy(); // 300 / 2
  });

  it('renders empty state when no range visits are provided', () => {
    render(<VisitsTab rangeVisits={[]} />);
    expect(screen.getByText('NO RANGE VISIT DATA')).toBeTruthy();
  });
});
