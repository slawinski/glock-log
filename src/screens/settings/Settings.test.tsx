import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Settings } from './Settings';
import { storage } from '../../services/storage-new';

jest.mock('../../services/storage-new', () => ({
  storage: {
    getCurrency: jest.fn(),
  },
}));

const Stack = createNativeStackNavigator();

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useFocusEffect: jest.fn(),
}));

const renderScreen = () => {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name='Settings' component={Settings} />
        <Stack.Screen name='CurrencySelection' component={() => <></>} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const mockStorage = storage as jest.Mocked<typeof storage>;

describe('Settings', () => {
  beforeEach(() => {
    mockStorage.getCurrency.mockResolvedValue('USD');
  });

  it('renders correctly and displays current currency', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('└── CURRENCY: [USD]')).toBeTruthy();
    });
  });

  it('navigates to CurrencySelection when currency item is pressed', async () => {
    renderScreen();
    const currencyItem = screen.getByText('└── CURRENCY: [USD]');
    fireEvent.press(currencyItem);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('CurrencySelection');
    });
  });

  it('handles error when loading currency', async () => {
    mockStorage.getCurrency.mockRejectedValue(new Error('Failed to load'));
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    renderScreen();
    await waitFor(() => {
      // Expect no crash, and error logged
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[Settings.loadCurrency] Failed to load',
        expect.any(Error)
      );
    });
    mockConsoleError.mockRestore();
  });
});
