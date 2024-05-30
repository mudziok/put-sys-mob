import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import { makeRedirectUri, useAuthRequest } from "expo-auth-session";

import { api } from "./api";

const discovery = {
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: "https://accounts.spotify.com/api/token",
};

const SpotifyAuthContext = createContext<{
  promptLogin: () => Promise<{ type: "success" | "dismiss" }>;
  accessToken: string | undefined;
}>({
  // eslint-disable-next-line @typescript-eslint/require-await
  promptLogin: async () => ({ type: "dismiss" }),
  accessToken: undefined,
});

export const SpotifyAuthProvider = ({ children }: { children: ReactNode }) => {
  const utils = api.useUtils();
  const [accessToken, setAccessToken] = useState<string | undefined>(undefined);

  const [_request, _response, promptAsync] = useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_AUTH_SPOTIFY_CLIENT_ID ?? "",
      scopes: [
        "user-read-email",
        "playlist-modify-public",
        "user-read-currently-playing",
        "user-read-playback-state",
        "user-modify-playback-state",
      ],
      // To follow the "Authorization Code Flow" to fetch token after authorizationEndpoint
      // this must be set to false
      usePKCE: false,
      extraParams: {
        show_dialog: "true",
      },
      redirectUri: makeRedirectUri(),
    },
    discovery,
  );

  const promptLogin = async () => {
    const response = await promptAsync();
    if (response.type === "success") {
      const { code } = response.params;

      if (!code) {
        throw new Error("No code in response");
      }

      const { accessToken } = await utils.spotify.getAccessToken.fetch({
        code,
      });

      setAccessToken(accessToken);
      return { type: "success" as const };
    }
    return { type: "dismiss" as const };
  };

  return (
    <SpotifyAuthContext.Provider
      value={{
        promptLogin,
        accessToken,
      }}
    >
      {children}
    </SpotifyAuthContext.Provider>
  );
};

export const useSpotifyAuth = () => useContext(SpotifyAuthContext);
