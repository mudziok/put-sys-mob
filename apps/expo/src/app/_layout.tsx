import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { TRPCProvider } from "~/utils/api";
import { SpotifyAuthProvider } from "~/utils/auth";

import "../styles.css";

import { SafeAreaProvider } from "react-native-safe-area-context";

// This is the main layout of the app
// It wraps your pages with the providers they need
export default function RootLayout() {
  return (
    <TRPCProvider>
      <SpotifyAuthProvider>
        <SafeAreaProvider>
          {/*
          The Stack component displays the current page.
          It also allows you to configure your screens 
        */}
          <Stack>
            <Stack.Screen name="map" options={{ headerShown: false }} />
            <Stack.Screen
              name="listen/[id]"
              options={{ presentation: "modal" }}
            />
          </Stack>
          <StatusBar />
        </SafeAreaProvider>
      </SpotifyAuthProvider>
    </TRPCProvider>
  );
}
