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

  const { data: listen } = api.listen.byId.useQuery({ id: parseInt(id) });
  const { mutate: play } = api.spotify.play.useMutation({
    onError: (error) => Alert.alert("Error", error.message, [{ text: "Ok" }]),
  });

  if (!listen) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center gap-2">
      <Stack.Screen options={{ title: listen.title }} />
      <Image style={{ width: 256, height: 256 }} source={listen.image} />
      <Text className="text-xl font-bold">{listen.title}</Text>
      {listen.radio && (
        <Text className="text-xl">On the {listen.radio.name} playlist</Text>
      )}
      <Pressable
        onPress={() => play({ uri: listen.uri, accessToken })}
        className="flex flex-row items-center gap-2 rounded-full bg-green-400 px-4 py-2 active:bg-green-500"
      >
        <FontAwesome name="spotify" size={20} />
        <Text>Play this song</Text>
      </Pressable>
    </View>
  );
}
