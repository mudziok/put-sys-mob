import { Pressable, ScrollView, Text, View } from "react-native";
import MapView from "react-native-maps";
import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { FontAwesome, FontAwesome6 } from "@expo/vector-icons";

import type { RouterOutputs } from "~/utils/api";
import RadioMarker from "~/components/RadioMarker";
import { api } from "~/utils/api";

type Radio = RouterOutputs["radio"]["byId"];

function AddToQueueButton() {
  return (
    <Pressable className="flex flex-row items-center gap-2 rounded-full bg-green-400 px-4 py-2 active:bg-green-500">
      <FontAwesome name="spotify" size={20} />
      <Text>Add playlist to queue</Text>
    </Pressable>
  );
}

function RadioHeader({ radio }: { radio: Pick<Radio, "listens" | "name"> }) {
  const right = radio.listens.at(0);
  const front = radio.listens.at(1);
  const left = radio.listens.at(2);

  return (
    <View className="relative flex w-full items-center gap-4 bg-black p-6">
      {/* TODO: Test if this image hack can be replaced with ImageBackground */}
      {right && (
        <Image
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.8,
          }}
          source={right.image}
          blurRadius={30}
        />
      )}
      <Pressable
        className="absolute left-6 top-6 opacity-30"
        onPress={() => router.push({ pathname: `..` })}
      >
        <FontAwesome6 name="chevron-left" size={20} color="white" />
      </Pressable>
      {front && left && right && (
        <View className="mt-4">
          <Image
            style={{ width: 256, height: 256, zIndex: 5 }}
            source={front.image}
          />
          <Image
            style={{
              width: 256,
              height: 256,
              position: "absolute",
              transform: [{ translateX: -24 }, { rotate: "-4deg" }],
            }}
            source={left.image}
          />
          <Image
            style={{
              width: 256,
              height: 256,
              position: "absolute",
              zIndex: 10,
              transformOrigin: "center",
              transform: [{ translateX: 24 }, { rotate: "4deg" }],
            }}
            source={right.image}
          />
        </View>
      )}
      <View className="flex flex-row items-center gap-2">
        <FontAwesome6 name="radio" size={16} color="white" />
        <Text className="text-xl font-bold text-white">{radio.name}</Text>
      </View>
      <AddToQueueButton />
    </View>
  );
}

function RadioDescriptionLocation({ radio }: { radio: Radio }) {
  const { location } = radio;

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
          <RadioMarker coordinate={{ latitude, longitude }} radio={radio} />
        </MapView>
      </View>
    </View>
  );
}

function RadioTracklist({ listens }: { listens: Radio["listens"] }) {
  return (
    <View className="flex items-start gap-2">
      <Text className="text-xl font-semibold">Tracklist</Text>
      {listens.map((listen) => (
        <Pressable
          key={listen.id}
          onPress={() =>
            router.push({
              pathname: `/listen/[listenId]`,
              params: { listenId: listen.id.toString() },
            })
          }
        >
          <Text className="text-xl">{listen.title}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function Radio() {
  const { radioId } = useLocalSearchParams();
  if (!radioId || typeof radioId !== "string") throw new Error("unreachable");

  const { data: radio } = api.radio.byId.useQuery({ id: parseInt(radioId) });

  if (!radio) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      <Stack.Screen options={{ title: radio.name }} />
      <RadioHeader radio={radio} />
      <View className="flex w-full flex-col gap-2 p-4">
        <RadioTracklist listens={radio.listens} />
        <RadioDescriptionLocation radio={radio} />
      </View>
    </ScrollView>
  );
}
