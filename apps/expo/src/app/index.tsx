import React from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";

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
        className="flex flex-row items-center gap-2 rounded-full bg-green-400 px-4 py-2 active:bg-green-500"
      >
        <FontAwesome name="spotify" size={20} />
        <Text>Login with Spotify</Text>
      </Pressable>
    </View>
  );
}
