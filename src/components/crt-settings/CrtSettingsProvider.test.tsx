import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  render,
  fireEvent,
  waitFor,
  screen,
  act,
} from "@testing-library/react-native";
import {
  CrtSettingsProvider,
  useCrtSettings,
} from "./CrtSettingsProvider";
import { storage } from "../../services/storage-new";
import { SettingsData } from "../../services/storage-service-interface";

jest.mock("../../services/storage-new", () => ({
  storage: {
    getSettings: jest.fn(),
    setCrtEffectEnabled: jest.fn(),
  },
}));

const mockStorage = storage as jest.Mocked<typeof storage>;

const Probe = () => {
  const { crtEnabled, setCrtEnabled } = useCrtSettings();
  return (
    <View>
      <Text testID="crt-value">{String(crtEnabled)}</Text>
      <Pressable testID="toggle" onPress={() => setCrtEnabled(!crtEnabled)} />
    </View>
  );
};

const renderProvider = () =>
  render(
    <CrtSettingsProvider>
      <Probe />
    </CrtSettingsProvider>
  );

describe("CrtSettingsProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.getSettings.mockResolvedValue({
      currency: "USD",
      biometricLockEnabled: true,
      crtEffectEnabled: true,
    });
    mockStorage.setCrtEffectEnabled.mockResolvedValue(undefined);
  });

  it("loads crtEnabled from settings on mount", async () => {
    mockStorage.getSettings.mockResolvedValue({
      currency: "USD",
      biometricLockEnabled: true,
      crtEffectEnabled: false,
    });

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId("crt-value").props.children).toBe("false");
    });
  });

  it("keeps crtEnabled unresolved while settings load, then reflects stored value", async () => {
    let resolveSettings!: (value: SettingsData) => void;
    mockStorage.getSettings.mockReturnValue(
      new Promise<SettingsData>((resolve) => {
        resolveSettings = resolve;
      })
    );

    renderProvider();

    expect(screen.getByTestId("crt-value").props.children).toBe("null");

    await act(async () => {
      resolveSettings({
        currency: "USD",
        biometricLockEnabled: true,
        crtEffectEnabled: false,
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("crt-value").props.children).toBe("false");
    });
  });

  it("persists the new value and updates state immediately", async () => {
    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId("crt-value").props.children).toBe("true");
    });

    fireEvent.press(screen.getByTestId("toggle"));

    await waitFor(() => {
      expect(mockStorage.setCrtEffectEnabled).toHaveBeenCalledWith(false);
      expect(screen.getByTestId("crt-value").props.children).toBe("false");
    });
  });
});

describe("useCrtSettings", () => {
  it("throws when used outside a CrtSettingsProvider", () => {
    const OffTreeProbe = () => {
      useCrtSettings();
      return null;
    };

    expect(() => render(<OffTreeProbe />)).toThrow(
      "useCrtSettings must be used within a CrtSettingsProvider"
    );
  });
});
