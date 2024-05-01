import { Pressable, Text, View } from "react-native";
import { Stack, useGlobalSearchParams } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";

import { api } from "~/utils/api";

export default function Radio() {
  const { id } = useGlobalSearchParams();
  if (!id || typeof id !== "string") throw new Error("unreachable");

  const { data: radio } = api.radio.byId.useQuery({ id: parseInt(id) });

  if (!radio) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center gap-2">
      <Stack.Screen options={{ title: radio.name }} />
      {radio.listens.map((listen) => (
        <Text className="text-xl" key={listen?.id}>
          {listen.title}
        </Text>
      ))}
      <Pressable className="flex flex-row items-center gap-2 rounded-full bg-green-400 px-4 py-2 active:bg-green-500">
        <FontAwesome name="spotify" size={20} />
        <Text>Add playlist to queue</Text>
      </Pressable>
    </View>
  );
}
