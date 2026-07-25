import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mimokids.app",
  appName: "MimoKids",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    SpeechRecognition: {
      // iOS: requestPermissions() is called explicitly before starting, no auto-prompt.
    },
  },
};

export default config;
