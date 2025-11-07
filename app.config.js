export default {
  expo: {
    name: "AgriMart Shop",
    slug: "agrimart-shop",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/logoA.jpg",
    scheme: "agrimart",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    extra: {
      apiUrl: process.env.PRODUCTION_API_URL,
      eas: {
        projectId: "94ffbb8e-2601-48eb-8541-290c0b48921b"
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