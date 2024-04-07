import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { TRPCProvider } from "~/utils/api";
import { SpotifyAuthProvider } from "~/utils/auth";

import "../styles.css";

// This is the main layout of the app
// It wraps your pages with the providers they need
export default function RootLayout() {
  return (
    <TRPCProvider>
      <SpotifyAuthProvider>
        {/*
          The Stack component displays the current page.
          It also allows you to configure your screens 
        */}
        <Stack />
        <StatusBar />
      </SpotifyAuthProvider>
    </TRPCProvider>
  );
}
