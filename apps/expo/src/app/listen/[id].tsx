import { Alert, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useGlobalSearchParams } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";

import { api } from "~/utils/api";
import { useSpotifyAuth } from "~/utils/auth";

export default function Listen() {
  const { id } = useGlobalSearchParams();
  const { accessToken } = useSpotifyAuth();
  if (!id || typeof id !== "string") throw new Error("unreachable");

  const { data } = api.listen.byId.useQuery({ id: parseInt(id) });
  const { mutate: play } = api.spotify.play.useMutation({
    onError: (error) => Alert.alert("Error", error.message, [{ text: "Ok" }]),
  });

  if (!data) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center gap-2">
      <Stack.Screen options={{ title: data.title }} />
      <Image style={{ width: 256, height: 256 }} source={data.image} />
      <Text className="text-xl font-bold">{data.title}</Text>
      <Pressable
        onPress={() => play({ uri: data.uri, accessToken })}
        className="flex flex-row items-center gap-2 rounded-full bg-green-400 px-4 py-2 active:bg-green-500"
      >
        <FontAwesome name="spotify" size={20} />
        <Text>Play this song</Text>
      </Pressable>
    </View>
  );
}
