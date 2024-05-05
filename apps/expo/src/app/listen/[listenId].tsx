import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import MapView from "react-native-maps";
import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { FontAwesome, FontAwesome6 } from "@expo/vector-icons";

import type { RouterOutputs } from "~/utils/api";
import ListenMarker from "~/components/ListenMarker";
import { api } from "~/utils/api";
import { useSpotifyAuth } from "~/utils/auth";

type Listen = RouterOutputs["listen"]["byId"];

function PlayButton({ uri }: { uri: Listen["uri"] }) {
  const { accessToken } = useSpotifyAuth();
  const { mutate: play } = api.spotify.play.useMutation({
    onError: (error) => Alert.alert("Error", error.message, [{ text: "Ok" }]),
  });

  return (
    <Pressable
      onPress={() => play({ uri, accessToken })}
      className="flex flex-row items-center gap-2 rounded-full bg-green-400 px-4 py-2 active:bg-green-500"
    >
      <FontAwesome name="spotify" size={20} />
      <Text>Play this song</Text>
    </Pressable>
  );
}

function LikeButton({ listen }: { listen: Listen }) {
  const { isReacted } = listen;

  const utils = api.useUtils();
  const { accessToken } = useSpotifyAuth();
  const { mutate: setReaction } = api.listen.setReaction.useMutation({
    async onMutate() {
      await utils.listen.byId.cancel({ id: listen.id, accessToken });
      const previousListen = utils.listen.byId.getData({
        id: listen.id,
        accessToken,
      });
      if (previousListen) {
        utils.listen.byId.setData({ id: listen.id, accessToken }, () => ({
          ...previousListen,
          reactionCount: previousListen.reactionCount + (isReacted ? -1 : 1),
          isReacted: !isReacted,
        }));
      }
      return { previousListen };
    },
    onError: (error, _, context) => {
      utils.listen.byId.setData(
        { id: listen.id, accessToken },
        () => context?.previousListen,
      );
      Alert.alert("Error", error.message, [{ text: "Ok" }]);
    },
    async onSettled() {
      await utils.listen.byId.invalidate({ id: listen.id, accessToken });
    },
  });

  return (
    <Pressable
      className="flex w-20 flex-row items-center justify-center gap-2 rounded-full bg-gray-200 px-4 py-2 active:bg-gray-300"
      onPress={() =>
        setReaction({ isReacted: !isReacted, listenId: listen.id, accessToken })
      }
    >
      <FontAwesome name={isReacted ? "heart" : "heart-o"} size={20} />
      <Text>{listen.reactionCount}</Text>
    </Pressable>
  );
}

function ListenHeader({ listen }: { listen: Listen }) {
  return (
    <View className="relative flex w-full items-center gap-4 bg-black p-6">
      {/* TODO: Test if this image hack can be replaced with ImageBackground */}
      <Image
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.8,
        }}
        source={listen.image}
        blurRadius={30}
      />
      <Pressable
        className="absolute left-6 top-6 opacity-30"
        onPress={() => router.push({ pathname: `..` })}
      >
        <FontAwesome6 name="chevron-left" size={20} color="white" />
      </Pressable>
      <Image style={{ width: 256, height: 256 }} source={listen.image} />
      <View className="flex items-center">
        <Text className="text-xl font-bold text-white">{listen.title}</Text>
        <Text className="text-xl text-white">{listen.artist}</Text>
      </View>
      <View className="flex flex-row gap-4">
        <PlayButton uri={listen.uri} />
        <LikeButton listen={listen} />
      </View>
    </View>
  );
}

function ListenDescriptionRadio({ radio }: { radio: Listen["radio"] }) {
  if (!radio) {
    return null;
  }

  return (
    <Pressable
      className="flex flex-row items-center gap-2 active:opacity-70"
      onPress={() =>
        router.push({
          pathname: `/radio/[radioId]`,
          params: { radioId: radio.id.toString() },
        })
      }
    >
      <Text className="text-xl font-semibold">On tracklist of radio</Text>
      <View className="flex flex-row justify-center gap-2 rounded-md bg-white p-2">
        <FontAwesome6 name="radio" size={16} />
        <Text className="font-bold">{radio.name}</Text>
      </View>
      <FontAwesome6 name="chevron-right" size={16} />
    </Pressable>
  );
}

function ListenDescriptionLocation({ listen }: { listen: Listen }) {
  const { location } = listen;

  if (!location) return null;
  const [longitude, latitude] = location.coordinates;
  if (!latitude || !longitude) return null;

  return (
    <View className="flex items-start gap-2">
      <Text className="text-xl font-semibold">Location</Text>
      <View className="relative h-52 w-full">
        <MapView
          style={{ flex: 1, pointerEvents: "none" }}
          region={{
            latitude,
            longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          minZoomLevel={12}
        >
          <ListenMarker coordinate={{ latitude, longitude }} listen={listen} />
        </MapView>
      </View>
    </View>
  );
}

function ListenDescription({ listen }: { listen: Listen }) {
  return (
    <View className="w-full gap-2 p-4">
      <ListenDescriptionRadio radio={listen.radio} />
      <View className="border-t border-gray-200" />
      <ListenDescriptionLocation listen={listen} />
      <View className="border-t border-gray-200" />
    </View>
  );
}

export default function Listen() {
  const { listenId } = useLocalSearchParams();
  const { accessToken } = useSpotifyAuth();
  if (!listenId || typeof listenId !== "string") throw new Error("unreachable");

  const { data: listen } = api.listen.byId.useQuery({
    id: parseInt(listenId),
    accessToken,
  });

  if (!listen) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView>
      <Stack.Screen options={{ title: listen.title }} />
      <ListenHeader listen={listen} />
      <ListenDescription listen={listen} />
    </ScrollView>
  );
}
