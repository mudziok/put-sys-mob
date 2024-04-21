import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";

import { useSpotifyAuth } from "~/utils/auth";

export default function Index() {
  const { promptLogin } = useSpotifyAuth();

  const login = async () => {
    const response = await promptLogin();
    if (response.type === "success") {
      router.replace("/map");
    }
  };

  return (
    <View className="flex flex-1 items-center justify-center">
      <Pressable
        onPress={login}
        className="rounded-full bg-green-400 px-4 py-2 active:bg-green-500"
      >
        <Text>Login with Spotify</Text>
      </Pressable>
    </View>
  );
}
