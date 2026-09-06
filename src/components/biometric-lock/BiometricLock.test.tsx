import React from "react";
import {
  render,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react-native";
import { View, AppState, AppStateStatus } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { BiometricLock, RELOCK_TIMEOUT_MS } from "./BiometricLock";
import { storage } from "../../services/storage-new";

jest.mock("expo-local-authentication", () => ({
  authenticateAsync: jest.fn(),
}));

jest.mock("../../services/storage-new", () => ({
  storage: {
    getSettings: jest.fn(),
  },
}));

const mockStorage = storage as jest.Mocked<typeof storage>;
const mockAuthenticate = LocalAuthentication.authenticateAsync as jest.Mock;

describe("BiometricLock", () => {
  let appStateHandler: ((state: AppStateStatus) => void) | null = null;
  let now = 0;

  beforeEach(() => {
    jest.clearAllMocks();
    appStateHandler = null;
    now = 1_000_000;
    jest.spyOn(Date, "now").mockImplementation(() => now);
    jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation(
        (_type: string, handler: (state: AppStateStatus) => void) => {
          appStateHandler = handler;
          return { remove: jest.fn() };
        }
      );
    mockStorage.getSettings.mockResolvedValue({
      currency: "USD",
      biometricLockEnabled: true,
      crtEffectEnabled: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderLock = () =>
    render(
      <BiometricLock>
        <View testID="protected-content" />
      </BiometricLock>
    );

  it("shows children after successful authentication", async () => {
    mockAuthenticate.mockResolvedValue({ success: true });

    const { getByTestId } = renderLock();

    await waitFor(() => {
      expect(getByTestId("protected-content")).toBeTruthy();
    });
    expect(mockAuthenticate).toHaveBeenCalledWith({
      promptMessage: "Unlock TriggerNote",
      cancelLabel: "Cancel",
    });
  });

  it("shows the lock screen when authentication fails", async () => {
    mockAuthenticate.mockResolvedValue({ success: false, error: "user_cancel" });

    const { getByTestId, getByText, queryByTestId } = renderLock();

    await waitFor(() => {
      expect(getByTestId("biometric-lock-screen")).toBeTruthy();
    });
    expect(queryByTestId("protected-content")).toBeNull();
    expect(getByText("RETRY")).toBeTruthy();
  });

  it("shows the lock screen when authentication throws", async () => {
    mockAuthenticate.mockRejectedValue(new Error("not available"));

    const { getByTestId, queryByTestId } = renderLock();

    await waitFor(() => {
      expect(getByTestId("biometric-lock-screen")).toBeTruthy();
    });
    expect(queryByTestId("protected-content")).toBeNull();
  });

  it("skips authentication when the biometric lock is disabled", async () => {
    mockStorage.getSettings.mockResolvedValue({
      currency: "USD",
      biometricLockEnabled: false,
      crtEffectEnabled: true,
    });

    const { getByTestId } = renderLock();

    await waitFor(() => {
      expect(getByTestId("protected-content")).toBeTruthy();
    });
    expect(mockAuthenticate).not.toHaveBeenCalled();
  });

  it("unlocks after pressing RETRY with a successful authentication", async () => {
    mockAuthenticate
      .mockResolvedValueOnce({ success: false, error: "user_cancel" })
      .mockResolvedValueOnce({ success: true });

    const { getByTestId, getByText, queryByTestId } = renderLock();

    await waitFor(() => {
      expect(getByText("RETRY")).toBeTruthy();
    });
    expect(queryByTestId("protected-content")).toBeNull();

    fireEvent.press(getByText("RETRY"));

    await waitFor(() => {
      expect(getByTestId("protected-content")).toBeTruthy();
    });
    expect(mockAuthenticate).toHaveBeenCalledTimes(2);
  });

  it("re-locks when the app returns from background after the timeout", async () => {
    mockAuthenticate.mockResolvedValue({ success: true });

    const { getByTestId, queryByTestId } = renderLock();

    await waitFor(() => {
      expect(getByTestId("protected-content")).toBeTruthy();
    });

    act(() => {
      now += 1000;
      appStateHandler?.("background");
    });
    act(() => {
      now += RELOCK_TIMEOUT_MS + 1000;
      appStateHandler?.("active");
    });

    expect(getByTestId("biometric-lock-screen")).toBeTruthy();
    expect(queryByTestId("protected-content")).toBeNull();
  });

  it("stays unlocked when returning from background within the timeout", async () => {
    mockAuthenticate.mockResolvedValue({ success: true });

    const { getByTestId, queryByTestId } = renderLock();

    await waitFor(() => {
      expect(getByTestId("protected-content")).toBeTruthy();
    });

    act(() => {
      now += 1000;
      appStateHandler?.("background");
    });
    act(() => {
      now += 5000;
      appStateHandler?.("active");
    });

    expect(getByTestId("protected-content")).toBeTruthy();
    expect(queryByTestId("biometric-lock-screen")).toBeNull();
  });

  it("does not re-lock when the biometric lock is disabled", async () => {
    mockStorage.getSettings.mockResolvedValue({
      currency: "USD",
      biometricLockEnabled: false,
      crtEffectEnabled: true,
    });

    const { getByTestId, queryByTestId } = renderLock();

    await waitFor(() => {
      expect(getByTestId("protected-content")).toBeTruthy();
    });

    act(() => {
      now += 1000;
      appStateHandler?.("background");
    });
    act(() => {
      now += RELOCK_TIMEOUT_MS + 1000;
      appStateHandler?.("active");
    });

    expect(getByTestId("protected-content")).toBeTruthy();
    expect(queryByTestId("biometric-lock-screen")).toBeNull();
  });
});
