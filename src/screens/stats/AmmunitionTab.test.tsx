import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { AmmunitionTab } from './AmmunitionTab';
import { AmmunitionStorage, RangeVisitStorage } from '../../validation/storageSchemas';

describe('AmmunitionTab', () => {
  const mockAmmunition: AmmunitionStorage[] = [
    {
      id: 'ammo1',
      caliber: '9mm',
      brand: 'Federal',
      grain: 115,
      quantity: 1000,
      amountPaid: 300,
      datePurchased: '2023-01-01T00:00:00.000Z',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    },
    {
      id: 'ammo2',
      caliber: '5.56',
      brand: 'PMC',
      grain: 55,
      quantity: 500,
      amountPaid: 250,
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
      firearmsUsed: [],
      ammunitionUsed: { 'firearm1': { ammunitionId: 'ammo1', rounds: 50 } },
      createdAt: '2023-01-15T00:00:00.000Z',
      updatedAt: '2023-01-15T00:00:00.000Z',
    },
  ];

  it('renders ammunition statistics correctly', () => {
    render(
      <AmmunitionTab
        ammunition={mockAmmunition}
        rangeVisits={mockRangeVisits}
      />
    );

    expect(screen.getByText('TOTAL ROUNDS: ')).toBeTruthy();
    expect(screen.getByText('1500')).toBeTruthy(); // 1000 + 500

    expect(screen.getByText('TOTAL SPENT: ')).toBeTruthy();
    expect(screen.getByText('$550.00')).toBeTruthy(); // 300 + 250

    expect(screen.getByText('COST PER ROUND: ')).toBeTruthy();
    expect(screen.getByText('$0.37')).toBeTruthy(); // 550 / 1500

    expect(screen.getByText('MOST STOCKED CALIBER: ')).toBeTruthy();
    expect(screen.getByText('9mm')).toBeTruthy();
  });

  it('renders empty state when no ammunition is provided', () => {
    render(<AmmunitionTab ammunition={[]} rangeVisits={[]} />);
    expect(screen.getByText('NO AMMUNITION DATA')).toBeTruthy();
  });

  it('renders empty state when no range visits are provided', () => {
    render(<AmmunitionTab ammunition={mockAmmunition} rangeVisits={[]} />);
    expect(screen.getByText('TOTAL ROUNDS: ')).toBeTruthy(); // Still shows stats based on ammunition stock
  });
});
