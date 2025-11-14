import { formatCurrency } from './currency';

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
  });

  it('formats EUR correctly', () => {
    expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
  });

  it('formats GBP correctly', () => {
    expect(formatCurrency(1234.56, 'GBP')).toBe('£1,234.56');
  });

  it('formats JPY correctly (no decimal places)', () => {
    expect(formatCurrency(1234, 'JPY')).toBe('¥1,234');
  });

  it('handles zero value', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
  });

  it('handles negative value', () => {
    expect(formatCurrency(-100, 'USD')).toBe('-$100.00');
  });

  it('handles unknown currency code, defaults to USD', () => {
    expect(formatCurrency(100, 'XYZ' as any)).toBe('$100.00');
  });

  it('handles large numbers', () => {
    expect(formatCurrency(12345678.9, 'USD')).toBe('$12,345,678.90');
  });

  it('handles numbers with more than 2 decimal places', () => {
    expect(formatCurrency(12.345, 'USD')).toBe('$12.35');
  });

  it('handles numbers with less than 2 decimal places', () => {
    expect(formatCurrency(12.3, 'USD')).toBe('$12.30');
  });
});
