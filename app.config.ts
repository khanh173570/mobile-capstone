// Load environment variables
import 'dotenv/config';

export default {
  owner: "khanh2003tran",
  expo: {
    name: "AgriMart Shop", // Auto-build APK test
    slug: "agrimart-shop-new",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/logoA.jpg",
    scheme: "agrimart",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    runtimeVersion: {
      policy: "sdkVersion"
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      eas: {
        projectId: "4efa3864-b8da-485a-8616-023817c89dcc"
      }
    },
    android: {
      package: "com.agrimart.shop",
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/images/logoA.jpg",
        backgroundColor: "#22C55E"
      },
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.agrimart.shop"
    },
    web: {
      bundler: "metro",
      output: "single",
      favicon: "./assets/images/logoA.jpg",
    },
    plugins: ["expo-router", "expo-font", "expo-web-browser"],
    experiments: {
      typedRoutes: true,
    },
  },
};