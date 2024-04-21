import type { LocationObject } from "expo-location";
import { Pressable, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { router } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";

import { api } from "~/utils/api";
import { useSpotifyAuth } from "~/utils/auth";
import { useLocation } from "~/utils/location";

function MusicPlayer({ location }: { location: LocationObject }) {
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
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
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

export default function Index() {
  const { location } = useLocation();
  const coords = location?.coords ?? {
    latitude: 37.78825,
    longitude: -122.4324,
  };
  const { data } = api.listen.all.useQuery(coords);
  const insets = useSafeAreaInsets();

  return (
    <View
      className="relative flex flex-1 bg-gray-100"
      style={{ paddingBottom: insets.bottom }}
    >
      <MapView
        style={{ flex: 1 }}
        region={{
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
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
              <View className="rounded-md bg-gray-100 p-1 active:opacity-90">
                <Image
                  style={{ width: 48, height: 48 }}
                  source={marker.image}
                />
              </View>
            </Marker>
          );
        })}
      </MapView>
      {location && <MusicPlayer location={location} />}
    </View>
  );
}
