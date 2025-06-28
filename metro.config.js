import { getDefaultConfig } from "expo/metro-config";

const config = getDefaultConfig(import.meta.url);

// Enable the new architecture
config.resolver.unstable_enableSymlinks = true;

// Configure for new architecture
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

export default config;
