import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ScanlinesOverlay } from './ScanlinesOverlay';

describe('ScanlinesOverlay', () => {
  it('renders the scanlines overlay', () => {
    render(<ScanlinesOverlay />);
    expect(screen.getByTestId('scanlines-overlay')).toBeTruthy();
  });
});
