import { useEffect } from "react";
import { View } from "react-native";
import { Marker } from "react-native-maps";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import type { Coords } from "~/utils/location";

const duration = 2000;
const easing = Easing.bezier(0.25, -0.5, 0.25, 1);

export default function UserLocationMarker({ coords }: { coords: Coords }) {
  const sv = useSharedValue<number>(1);

  useEffect(() => {
    sv.value = withRepeat(withTiming(0, { duration, easing }), -1);
  }, [sv]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: sv.value,
    transform: [{ scale: 2.0 - sv.value }],
  }));

  return (
    <Marker coordinate={coords} zIndex={10}>
      <Animated.View
        className="absolute rounded-full bg-blue-500 p-[10px]"
        style={animatedStyle}
      />
      <View className="absolute rounded-full bg-blue-500 p-[10px]" />
    </Marker>
  );
}
