import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import Animated, {
  Easing,
  FadeInDown,
  FadeOutDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { router } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";

import type { Coords } from "~/utils/location";
import { api } from "~/utils/api";
import { useSpotifyAuth } from "~/utils/auth";
import { useScrollLocation } from "~/utils/location";

function MusicPlayer({ coords }: { coords: Coords }) {
  const { accessToken } = useSpotifyAuth();
  const utils = api.useUtils();

  const { data: track, refetch } = api.spotify.getCurrenlyPlaying.useQuery(
    { accessToken },
    { refetchInterval: 10000 },
  );

  const { mutate } = api.listen.create.useMutation({
    async onSuccess() {
      await utils.listen.all.invalidate();
    },
  });

  if (!track) {
    return null;
  }

  return (
    <View className="flex flex-row gap-2 border-t border-gray-200 bg-gray-100 p-2">
      <Image
        style={{ width: 64, height: 64 }}
        source={track.item.album.images[0]?.url}
      />
      <View className="flex flex-1 flex-col items-center justify-center gap-1">
        <Text className="font-semibold">{track.item.name}</Text>
        <Text>
          {track.item.artists.map((artist) => artist.name).join(", ")}
        </Text>
      </View>
      <View className="flex flex-row items-center gap-2">
        <Pressable
          className="flex aspect-square h-12 items-center justify-center rounded-full border border-gray-200 active:bg-gray-200"
          onPress={() => refetch()}
        >
          <FontAwesome name="refresh" size={20} color="black" />
        </Pressable>
        <Pressable
          className="flex aspect-square h-12 items-center justify-center rounded-full border border-gray-200 active:bg-gray-200"
          onPress={() =>
            mutate({
              ...coords,
              title: track.item.name,
              uri: track.item.uri,
              image: track.item.album.images[0]?.url,
            })
          }
        >
          <FontAwesome name="map-marker" size={20} color="black" />
        </Pressable>
      </View>
    </View>
  );
}

const duration = 2000;
const easing = Easing.bezier(0.25, -0.5, 0.25, 1);

function UserMarker({ coords }: { coords: Coords }) {
  const sv = useSharedValue<number>(1);

  useEffect(() => {
    sv.value = withRepeat(withTiming(0, { duration, easing }), 0);
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

export default function Index() {
  const { coords, locationCoords, setScrollCoords, isScrolled } =
    useScrollLocation();

  const { data } = api.listen.all.useQuery(locationCoords, {
    placeholderData: (prev) => prev,
  });
  const insets = useSafeAreaInsets();

  return (
    <View
      className="relative flex flex-1 bg-gray-100"
      style={{ paddingBottom: insets.bottom }}
    >
      <View style={{ flex: 1, position: "relative" }}>
        <MapView
          style={{ flex: 1 }}
          region={coords}
          onRegionChangeComplete={(coords) => setScrollCoords(coords)}
          minZoomLevel={10}
        >
          {data?.map((marker) => {
            if (!marker.location?.coordinates) return null;
            const [longitude, latitude] = marker.location.coordinates;
            if (!latitude || !longitude) return null;
            return (
              <Marker
                key={marker.id}
                coordinate={{
                  latitude: latitude,
                  longitude: longitude,
                }}
                onPress={() =>
                  router.push({
                    pathname: `/listen/[id]`,
                    params: { id: marker.id.toString() },
                  })
                }
              >
                <Animated.View
                  className="rounded-md bg-gray-100 p-1 active:opacity-80"
                  entering={FadeInDown}
                  exiting={FadeOutDown}
                >
                  <Image
                    style={{ width: 48, height: 48 }}
                    source={marker.image}
                  />
                </Animated.View>
              </Marker>
            );
          })}
          <UserMarker coords={locationCoords} />
        </MapView>
        {isScrolled && (
          <Pressable
            className="absolute bottom-2 right-2 flex aspect-square h-12 items-center justify-center rounded-full border border-gray-200 bg-gray-100 active:bg-gray-200"
            onPress={() => setScrollCoords(null)}
          >
            <FontAwesome name="location-arrow" size={20} color="black" />
          </Pressable>
        )}
      </View>
      {locationCoords && <MusicPlayer coords={locationCoords} />}
    </View>
  );
}
