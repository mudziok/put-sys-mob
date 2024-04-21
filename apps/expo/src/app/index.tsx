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
    <View>
      <Pressable onPress={login}>
        <Text>Login</Text>
      </Pressable>
    </View>
  );
}
