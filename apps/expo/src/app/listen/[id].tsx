import { StatusBar, Text, View } from "react-native";
import { Image } from "expo-image";
import { Link, useGlobalSearchParams } from "expo-router";

import { api } from "~/utils/api";

export default function Listen() {
  const { id } = useGlobalSearchParams();
  if (!id || typeof id !== "string") throw new Error("unreachable");

  const { data } = api.listen.byId.useQuery({ id: parseInt(id) });

  if (!data) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center gap-2">
      <Image style={{ width: 256, height: 256 }} source={data.image} />
      <Text className="text-xl font-bold">{data.title}</Text>
      <Link href="../">Dismiss</Link>
      <StatusBar />
    </View>
  );
}
