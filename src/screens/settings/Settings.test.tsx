import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  within,
} from '@testing-library/react-native';
import { Alert, AlertButton } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as LocalAuthentication from 'expo-local-authentication';
import { Settings } from './Settings';
import { storage } from '../../services/storage-new';

jest.mock('../../services/storage-new', () => ({
  storage: {
    getSettings: jest.fn(),
    setBiometricLockEnabled: jest.fn(),
  },
}));

jest.mock('expo-local-authentication', () => ({
  authenticateAsync: jest.fn(),
  supportedAuthenticationTypesAsync: jest.fn(),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
}));

const mockSetCrtEnabled = jest.fn();
jest.mock('../../components/crt-settings', () => ({
  CrtSettingsProvider: ({ children }: { children: React.ReactNode }) => children,
  useCrtSettings: () => ({
    crtEnabled: true,
    setCrtEnabled: mockSetCrtEnabled,
  }),
}));

const Stack = createNativeStackNavigator();

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  // Settings loads data solely via useFocusEffect (no mount useEffect), so
  // invoke the effect callback on mount to mirror react-navigation's behavior.
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = require('react');
    useEffect(callback, [callback]);
  },
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
const mockAuthenticate = LocalAuthentication.authenticateAsync as jest.Mock;
const mockSupportedTypes = LocalAuthentication
  .supportedAuthenticationTypesAsync as jest.Mock;

describe('Settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.getSettings.mockResolvedValue({
      currency: 'USD',
      biometricLockEnabled: true,
      crtEffectEnabled: true,
    });
    mockStorage.setBiometricLockEnabled.mockResolvedValue(undefined);
    mockSupportedTypes.mockResolvedValue([
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
    ]);
  });

  it('renders section headings and displays current currency', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('SECURITY')).toBeTruthy();
      expect(screen.getByText('APPEARANCE')).toBeTruthy();
      expect(screen.getByText('GENERAL')).toBeTruthy();
      expect(screen.getByText('CURRENCY: [USD]')).toBeTruthy();
    });
  });

  it('navigates to CurrencySelection when currency item is pressed', async () => {
    renderScreen();
    const currencyItem = screen.getByText('CURRENCY: [USD]');
    fireEvent.press(currencyItem);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('CurrencySelection');
    });
  });

  it('handles error when loading settings', async () => {
    mockStorage.getSettings.mockRejectedValue(new Error('Failed to load'));
    const mockConsoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    renderScreen();
    await waitFor(() => {
      // Expect no crash, and error logged
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[Settings.loadSettings] Failed to load',
        expect.any(Error)
      );
    });
    mockConsoleError.mockRestore();
  });

  it('displays the biometric lock toggle as ON when enabled', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('BIOMETRIC LOCK')).toBeTruthy();
      const biometricRow = screen.getByLabelText('Biometric lock');
      expect(within(biometricRow).getByText('ON')).toBeTruthy();
    });
  });

  it('displays the biometric lock toggle as OFF when disabled', async () => {
    mockStorage.getSettings.mockResolvedValue({
      currency: 'USD',
      biometricLockEnabled: false,
      crtEffectEnabled: true,
    });

    renderScreen();
    await waitFor(() => {
      const biometricRow = screen.getByLabelText('Biometric lock');
      expect(within(biometricRow).getByText('OFF')).toBeTruthy();
    });
  });

  it('shows a confirmation alert and disables the lock when confirmed', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('BIOMETRIC LOCK')).toBeTruthy();
    });

    const biometricRow = screen.getByLabelText('Biometric lock');
    fireEvent.press(within(biometricRow).getByText('ON'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Turn off biometric lock?',
      'TriggerNote will open without biometric authentication.',
      expect.any(Array)
    );

    // Simulate confirming the disable action
    const buttons = alertSpy.mock.calls[0][2] as AlertButton[];
    const disableButton = buttons.find((button) => button.text === 'Turn off');
    expect(disableButton).toBeTruthy();

    await act(async () => {
      disableButton?.onPress?.();
    });

    expect(mockStorage.setBiometricLockEnabled).toHaveBeenCalledWith(false);
    await waitFor(() => {
      expect(within(biometricRow).getByText('OFF')).toBeTruthy();
    });

    alertSpy.mockRestore();
  });

  it('authenticates before enabling the lock when disabled', async () => {
    mockStorage.getSettings.mockResolvedValue({
      currency: 'USD',
      biometricLockEnabled: false,
      crtEffectEnabled: true,
    });
    mockAuthenticate.mockResolvedValue({ success: true });

    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('BIOMETRIC LOCK')).toBeTruthy();
    });

    const biometricRow = screen.getByLabelText('Biometric lock');
    fireEvent.press(within(biometricRow).getByText('OFF'));

    await waitFor(() => {
      expect(mockAuthenticate).toHaveBeenCalledWith({
        promptMessage: 'Authenticate to enable biometric lock',
        cancelLabel: 'Cancel',
      });
      expect(mockStorage.setBiometricLockEnabled).toHaveBeenCalledWith(true);
    });
    await waitFor(() => {
      expect(within(biometricRow).getByText('ON')).toBeTruthy();
    });
  });

  it('does not enable the lock when authentication fails', async () => {
    mockStorage.getSettings.mockResolvedValue({
      currency: 'USD',
      biometricLockEnabled: false,
      crtEffectEnabled: true,
    });
    mockAuthenticate.mockResolvedValue({ success: false, error: 'user_cancel' });

    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('BIOMETRIC LOCK')).toBeTruthy();
    });

    const biometricRow = screen.getByLabelText('Biometric lock');
    fireEvent.press(within(biometricRow).getByText('OFF'));

    await waitFor(() => {
      expect(mockAuthenticate).toHaveBeenCalled();
    });
    expect(mockStorage.setBiometricLockEnabled).not.toHaveBeenCalled();
    expect(within(biometricRow).getByText('OFF')).toBeTruthy();
  });

  it('shows the detected authentication method label', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('METHOD: Face ID')).toBeTruthy();
    });
  });

  it('toggles the CRT effect via setCrtEnabled', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('CRT EFFECT')).toBeTruthy();
    });

    const crtRow = screen.getByTestId('crt-effect-row');
    expect(within(crtRow).getByText('ON')).toBeTruthy();

    fireEvent.press(within(crtRow).getByText('ON'));
    expect(mockSetCrtEnabled).toHaveBeenCalledWith(false);
  });
});
