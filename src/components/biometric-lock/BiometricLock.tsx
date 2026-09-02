import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, View } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { TerminalButton } from "../terminal-button/TerminalButton";
import { TerminalText } from "../terminal-text/TerminalText";
import { storage } from "../../services/storage-new";
import { handleError } from "../../services/error-handler";

// Re-lock the app when it returns from the background after this many ms.
export const RELOCK_TIMEOUT_MS = 30_000;

type LockStatus = "loading" | "locked" | "unlocked";

type Props = {
  children: React.ReactNode;
};

export const BiometricLock = ({ children }: Props) => {
  const [status, setStatus] = useState<LockStatus>("loading");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [lockEnabled, setLockEnabled] = useState(true);
  const backgroundedAtRef = useRef<number | null>(null);
  const authenticatingRef = useRef(false);

  const authenticate = useCallback(async () => {
    if (authenticatingRef.current) {
      return;
    }
    authenticatingRef.current = true;
    setIsAuthenticating(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock TriggerNote",
        cancelLabel: "Cancel",
        // Device passcode is allowed as a fallback for users without biometrics.
      });
      setStatus(result.success ? "unlocked" : "locked");
    } catch (error) {
      handleError(error, "BiometricLock.authenticate", {
        userMessage: "Authentication failed.",
      });
      // Fail closed: keep the app locked if authentication cannot be completed.
      setStatus("locked");
    } finally {
      authenticatingRef.current = false;
      setIsAuthenticating(false);
    }
  }, []);

  const initialize = useCallback(async () => {
    try {
      const settings = await storage.getSettings();
      const enabled = settings.biometricLockEnabled;
      setLockEnabled(enabled);
      if (!enabled) {
        setStatus("unlocked");
        return;
      }
      await authenticate();
    } catch (error) {
      handleError(error, "BiometricLock.initialize", {
        userMessage: "Failed to load lock settings.",
      });
      // Fail closed when the lock state cannot be determined.
      setLockEnabled(true);
      setStatus("locked");
    }
  }, [authenticate]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleAppStateChange = useCallback(
    (nextState: AppStateStatus) => {
      if (nextState === "inactive" || nextState === "background") {
        backgroundedAtRef.current = Date.now();
        return;
      }

      if (nextState === "active") {
        const backgroundedAt = backgroundedAtRef.current;
        backgroundedAtRef.current = null;

        if (
          backgroundedAt !== null &&
          lockEnabled &&
          status === "unlocked" &&
          Date.now() - backgroundedAt > RELOCK_TIMEOUT_MS
        ) {
          setStatus("locked");
        }
      }
    },
    [lockEnabled, status]
  );

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription.remove();
  }, [handleAppStateChange]);

  // Blank screen while settings load / authentication is in flight so app
  // content is never flashed before the auth decision.
  if (status === "loading") {
    return null;
  }

  if (status === "locked") {
    return (
      <View
        testID="biometric-lock-screen"
        className="flex-1 bg-terminal-bg justify-center items-center px-8"
      >
        <TerminalText className="text-terminal-error text-2xl mb-2">
          SYSTEM LOCKED
        </TerminalText>
        <TerminalText className="text-terminal-muted text-center mb-8">
          {isAuthenticating
            ? "AUTHENTICATING..."
            : "AUTHENTICATION REQUIRED TO ACCESS DATA"}
        </TerminalText>
        <TerminalButton
          caption="RETRY"
          onPress={authenticate}
          disabled={isAuthenticating}
        />
      </View>
    );
  }

  return <>{children}</>;
};
