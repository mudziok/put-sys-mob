import type { MapMarkerProps } from "react-native-maps";
import { Text, View } from "react-native";
import { Marker } from "react-native-maps";
import { Image } from "expo-image";

import type { RouterOutputs } from "~/utils/api";

interface Radio {
  name: string;
  listens: RouterOutputs["listen"]["byId"][];
}

export default function RadioMarker({
  radio,
  ...mapMarkerProps
}: {
  radio: Radio;
} & MapMarkerProps) {
  const front = radio.listens.at(0);
  const left = radio.listens.at(1);
  const right = radio.listens.at(2);

  if (!front || !left || !right) {
    return null;
  }

  return (
    <Marker {...mapMarkerProps}>
      <View className="relative flex items-center gap-2 active:opacity-80">
        <View className="rounded-md bg-white p-1">
          <Text className="font-bold">{radio.name}</Text>
        </View>
        <View className="relative">
          <View
            className={`absolute -translate-x-6 -rotate-12 rounded-md bg-gray-100 p-1`}
          >
            <Image style={{ width: 48, height: 48 }} source={left.image} />
          </View>
          <View
            className={`absolute translate-x-6 rotate-12 rounded-md bg-gray-100 p-1`}
          >
            <Image style={{ width: 48, height: 48 }} source={right.image} />
          </View>
          <View className={`rounded-md bg-gray-100 p-1`}>
            <Image style={{ width: 48, height: 48 }} source={front.image} />
          </View>
        </View>
      </View>
    </Marker>
  );
}
