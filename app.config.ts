import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "SmartStay",
  slug: "smartstay-app-v2",
  owner: "shaswat2004",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/brand_icon.jpg",
  scheme: "smartstay",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  extra: {
    eas: {
      projectId: "f1006218-c5cf-44a9-8903-6a11f940d10f"
    }
  },
  updates: {
    url: "https://u.expo.dev/f1006218-c5cf-44a9-8903-6a11f940d10f"
  },
  runtimeVersion: {
    policy: "appVersion"
  },
  ios: {
    supportsTablet: true
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#FFFFFF",
      foregroundImage: "./assets/home_screen_icon.jpg",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.shaswat.smartstay",
    googleServicesFile: "./google-services.json"
  },
  web: {
    output: "static",
    favicon: "./assets/brand_icon.jpg"
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        "image": "./assets/brand_icon.jpg",
        "imageWidth": 200,
        "resizeMode": "contain",
        "backgroundColor": "#ffffff",
        "dark": {
          "backgroundColor": "#000000"
        }
      }
    ],
    "expo-font",
    "expo-notifications",
    "expo-web-browser",
    "@react-native-google-signin/google-signin",
    "expo-secure-store",
    "expo-local-authentication",
    [
      "expo-camera",
      {
        "cameraPermission": "Allow SmartStay to access your camera to scan student leave QR codes."
      }
    ]
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true
  }
});
