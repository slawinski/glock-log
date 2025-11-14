import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CurrencySelection } from './CurrencySelection';
import { storage } from '../../services/storage-new';

jest.mock('../../services/storage-new', () => ({
  storage: {
    getCurrency: jest.fn(),
    setCurrency: jest.fn(),
  },
}));

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
}));

const Stack = createNativeStackNavigator();

const renderScreen = () => {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name='CurrencySelection' component={CurrencySelection} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

describe('CurrencySelection', () => {
  const mockStorage = storage as jest.Mocked<typeof storage>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.getCurrency.mockResolvedValue('USD');
    mockStorage.setCurrency.mockResolvedValue(undefined);
    mockGoBack.mockClear();
  });

  it('renders correctly and displays current currency', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('├── USD: US Dollar ($) [SELECTED]')).toBeTruthy();
    });
  });

  it('allows selecting a new currency', async () => {
    renderScreen();
    await waitFor(() => {
      const eurOption = screen.getByText('├── EUR: Euro (€)');
      fireEvent.press(eurOption);
    });

    await waitFor(() => {
      expect(mockStorage.setCurrency).toHaveBeenCalledWith('EUR');
      expect(mockGoBack).toHaveBeenCalledTimes(1);
    });
  });

  it('handles error when loading currency', async () => {
    mockStorage.getCurrency.mockRejectedValue(new Error('Failed to load'));
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    renderScreen();
    await waitFor(() => {
      // Expect no crash, and error logged
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[CurrencySelection.loadCurrentCurrency] Failed to load',
        expect.any(Error)
      );
    });
    mockConsoleError.mockRestore();
  });

  it('handles error when setting currency', async () => {
    mockStorage.setCurrency.mockRejectedValue(new Error('Failed to set'));
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    renderScreen();
    await waitFor(() => {
      const eurOption = screen.getByText('├── EUR: Euro (€)');
      fireEvent.press(eurOption);
    });

    await waitFor(() => {
      // Expect no crash, and error logged
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[CurrencySelection.handleCurrencySelect] Failed to set',
        expect.any(Error)
      );
    });
    mockConsoleError.mockRestore();
  });
});