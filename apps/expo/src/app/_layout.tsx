import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { TRPCProvider } from "~/utils/api";
import { SpotifyAuthProvider } from "~/utils/auth";
import { AutoPlayProvider } from "~/utils/autoplay";

import "../styles.css";

// This is the main layout of the app
// It wraps your pages with the providers they need
export default function RootLayout() {
  return (
    <TRPCProvider>
      <SpotifyAuthProvider>
        <AutoPlayProvider>
          <SafeAreaProvider>
            {/*
          The Stack component displays the current page.
          It also allows you to configure your screens 
        */}
            <Stack>
              <Stack.Screen name="map" options={{ headerShown: false }} />
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen
                name="settings"
                options={{ title: "Settings", headerBackTitle: "Back" }}
              />
              <Stack.Screen
                name="listen/[listenId]"
                options={{ presentation: "modal", headerShown: false }}
              />
              <Stack.Screen
                name="radio/[radioId]"
                options={{ presentation: "modal", headerShown: false }}
              />
            </Stack>
            <StatusBar />
          </SafeAreaProvider>
        </AutoPlayProvider>
      </SpotifyAuthProvider>
    </TRPCProvider>
  );
}
