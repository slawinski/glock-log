import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { storage } from "../../services/storage-new";
import { handleError } from "../../services/error-handler";

type CrtSettingsContextValue = {
  crtEnabled: boolean | null;
  setCrtEnabled: (enabled: boolean) => Promise<void>;
};

const CrtSettingsContext = createContext<CrtSettingsContextValue | null>(null);

type Props = {
  children: React.ReactNode;
};

export const CrtSettingsProvider = ({ children }: Props) => {
  const [crtEnabled, setCrtEnabledState] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const settings = await storage.getSettings();
        if (mounted) {
          setCrtEnabledState(settings.crtEffectEnabled);
        }
      } catch (error) {
        handleError(error, "CrtSettingsProvider.load", {
          userMessage: "Failed to load CRT effect setting.",
        });
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const setCrtEnabled = useCallback(async (enabled: boolean) => {
    try {
      await storage.setCrtEffectEnabled(enabled);
      setCrtEnabledState(enabled);
    } catch (error) {
      handleError(error, "CrtSettingsProvider.setCrtEnabled", {
        userMessage: "Failed to update CRT effect setting.",
      });
    }
  }, []);

  return (
    <CrtSettingsContext.Provider value={{ crtEnabled, setCrtEnabled }}>
      {children}
    </CrtSettingsContext.Provider>
  );
};

export const useCrtSettings = (): CrtSettingsContextValue => {
  const context = useContext(CrtSettingsContext);
  if (!context) {
    throw new Error("useCrtSettings must be used within a CrtSettingsProvider");
  }
  return context;
};
