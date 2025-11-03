export default {
  expo: {
    name: "AgriMart Shop",
    slug: "bolt-expo-nativewind",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/logoA.jpg",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    extra: {
      identityApiUrl: process.env.IDENTITY_API_URL || "https://identity.a-379.store/api",
      farmApiUrl: process.env.FARM_API_URL || "https://farm.a-379.store/api",
    },
    ios: {
      supportsTablet: true,
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