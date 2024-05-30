import { Alert, Pressable, Text, View } from "react-native";
import MapView from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { router } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";

import type { Coords } from "~/utils/location";
import ListenMarker from "~/components/ListenMarker";
import RadioMarker from "~/components/RadioMarker";
import UserLocationMarker from "~/components/UserLocationMarker";
import { api } from "~/utils/api";
import { useSpotifyAuth } from "~/utils/auth";
import { useScrollLocation } from "~/utils/location";

function MusicPlayer({ coords }: { coords: Coords }) {
  const { accessToken } = useSpotifyAuth();
  const utils = api.useUtils();

  const { data: playback, refetch } = api.spotify.getCurrenlyPlaying.useQuery(
    { accessToken },
    { refetchInterval: 10000 },
  );

  const { mutate } = api.listen.create.useMutation({
    async onSuccess() {
      await utils.listen.all.invalidate();
    },
  });

  if (!playback) {
    return null;
  }

  if (!playback.item) {
    return (
      <View className="flex flex-row justify-center gap-2 border-t border-gray-200 bg-gray-100 p-2">
        <Text className="font-semibold">
          Nothing is being played in your Spotify app
        </Text>
      </View>
    );
  }

  const title = playback.item.name;
  const artist = playback.item.artists.map((artist) => artist.name).join(", ");
  const imageUrl = playback.item.album.images[0]?.url;

  const addListenAlert = () =>
    Alert.alert(
      "Mark a listen",
      `Do you want to mark your listen to "${title}" by ${artist}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Mark a listen",
          onPress: () =>
            mutate({
              ...coords,
              title,
              artist,
              itemUri: playback.item.uri,
              contextUri: playback.item.album.uri,
              image: imageUrl,
            }),
        },
      ],
    );

  return (
    <View className="flex flex-row gap-2 border-t border-gray-200 bg-gray-100 p-2">
      <Image style={{ width: 64, height: 64 }} source={imageUrl} />
      <View className="flex flex-1 flex-col items-center justify-center gap-1">
        <Text className="font-semibold">{title}</Text>
        <Text>{artist}</Text>
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
          onPress={() => addListenAlert()}
        >
          <FontAwesome name="map-marker" size={20} color="black" />
        </Pressable>
      </View>
    </View>
  );
}

export default function Index() {
  const insets = useSafeAreaInsets();

  const { coords, locationCoords, setScrollCoords, isScrolled } =
    useScrollLocation();

  const { data: listens } = api.listen.all.useQuery(locationCoords, {
    placeholderData: (prev) => prev,
  });
  const { data: radios } = api.radio.all.useQuery(locationCoords, {
    placeholderData: (prev) => prev,
  });

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
          {listens?.map((marker) => {
            if (!marker.location?.coordinates) return null;
            const [longitude, latitude] = marker.location.coordinates;
            if (!latitude || !longitude) return null;
            return (
              <ListenMarker
                key={marker.id}
                listen={marker}
                coordinate={{ latitude, longitude }}
                onPress={() =>
                  router.push({
                    pathname: `/listen/[listenId]`,
                    params: { listenId: marker.id.toString() },
                  })
                }
              />
            );
          })}
          {radios?.map((marker) => {
            if (!marker.location?.coordinates) return null;
            const [longitude, latitude] = marker.location.coordinates;
            if (!latitude || !longitude || !listens) return null;
            return (
              <RadioMarker
                key={marker.id}
                coordinate={{ latitude, longitude }}
                radio={marker}
                onPress={() =>
                  router.push({
                    pathname: `/radio/[radioId]`,
                    params: { radioId: marker.id.toString() },
                  })
                }
              />
            );
          })}
          <UserLocationMarker coords={locationCoords} />
        </MapView>
        {isScrolled && (
          <Pressable
            className="absolute bottom-2 right-2 flex aspect-square h-12 items-center justify-center rounded-full border border-gray-200 bg-gray-100 active:bg-gray-200"
            onPress={() => setScrollCoords(null)}
          >
            <FontAwesome name="location-arrow" size={20} color="black" />
          </Pressable>
        )}
        <Pressable
          className="absolute left-2 flex aspect-square h-12 items-center justify-center rounded-full border border-gray-200 bg-gray-100 active:bg-gray-200"
          style={{ top: insets.top + 8 }}
          onPress={() => router.push({ pathname: `/settings` })}
        >
          <FontAwesome name="cog" size={20} color="black" />
        </Pressable>
      </View>
      {locationCoords && <MusicPlayer coords={locationCoords} />}
    </View>
  );
}
