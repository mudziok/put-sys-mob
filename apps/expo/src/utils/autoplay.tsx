import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useThrottle } from "@uidotdev/usehooks";

import { api } from "./api";
import { useSpotifyAuth } from "./auth";
import { useLocation } from "./location";

const AutoplayContext = createContext<{
  isAutoPlay: boolean;
  setIsAutoPlay: (isAutoPlay: boolean) => void;
}>({
  isAutoPlay: false,
  setIsAutoPlay: () =>
    console.error(
      "AutoplayContext not found, make sure its in the component tree",
    ),
});

export const AutoPlayProvider = ({ children }: { children: ReactNode }) => {
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const { coords } = useLocation();
  const { accessToken } = useSpotifyAuth();
  const { mutate: requestAutoplay } = api.spotify.requestAutoplay.useMutation();

  const throttledCoords = useThrottle(coords, 10000);

  useEffect(() => {
    if (isAutoPlay && accessToken) {
      void requestAutoplay({ ...throttledCoords, accessToken });
    }
  }, [isAutoPlay, requestAutoplay, throttledCoords, accessToken]);

  return (
    <AutoplayContext.Provider value={{ isAutoPlay, setIsAutoPlay }}>
      {children}
    </AutoplayContext.Provider>
  );
};

export const useAutoPlay = () => useContext(AutoplayContext);
