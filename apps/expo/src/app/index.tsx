import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

import { api } from "~/utils/api";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
});

export default function Index() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  const utils = api.useUtils();

  const { data, refetch } = api.listen.all.useQuery({
    longitude: -60.4324,
    latitude: 3.78825,
  });
  const { mutate } = api.listen.create.useMutation({
    async onSuccess() {
      await utils.listen.all.invalidate();
    },
  });

  let text = "Waiting..";
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = JSON.stringify(location);
  }

  return (
    <View style={styles.container}>
      <Text>{text}</Text>

      <Pressable
        onPress={() => {
          if (location) {
            const { longitude, latitude } = location.coords;
            mutate({ longitude, latitude });
          }
        }}
      >
        <Text className="mt-2 text-foreground">Add listen</Text>
      </Pressable>
      <Pressable onPress={() => refetch()}>
        <Text className="mt-2 text-foreground">Refetch</Text>
      </Pressable>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {data?.map((marker) => {
          if (!marker.location?.coordinates) return null;
          const [longitude, latitude] = marker.location.coordinates;
          if (!latitude || !longitude) return null;
          return (
            <Text key={marker.id}>
              {JSON.stringify(marker.location.coordinates)}
            </Text>
          );
        })}

        {data?.map((marker) => {
          if (!marker.location?.coordinates) return null;
          const [longitude, latitude] = marker.location.coordinates;
          if (!latitude || !longitude) return null;
          return (
            <Marker
              key={marker.id}
              coordinate={{
                latitude: latitude,
                longitude: longitude,
              }}
              title={"xd"}
              description={"xd"}
            />
          );
        })}
      </MapView>
    </View>
  );
}
