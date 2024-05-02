import type { MapMarkerProps } from "react-native-maps";
import { Marker } from "react-native-maps";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { Image } from "expo-image";

import type { RouterOutputs } from "~/utils/api";

type Listen = RouterOutputs["listen"]["all"][0];

export default function ListenMarker({
  listen,
  ...mapMarkerProps
}: {
  listen: Listen;
} & MapMarkerProps) {
  return (
    <Marker {...mapMarkerProps}>
      <Animated.View
        className="rounded-md bg-gray-100 p-1 active:opacity-80"
        entering={FadeInDown}
        exiting={FadeOutDown}
      >
        <Image style={{ width: 48, height: 48 }} source={listen.image} />
      </Animated.View>
    </Marker>
  );
}
