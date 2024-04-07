import { Button, Text, View } from "react-native";
import { Image } from "expo-image";

import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";
import { useSpotifyAuth } from "~/utils/auth";

function TrackPreview({
  track,
}: {
  track: RouterOutputs["spotify"]["getCurrenlyPlaying"];
}) {
  return (
    <View>
      <Text className="font-bold">{track.item.name}</Text>
      <Text>{track.item.artists.map((artist) => artist.name).join(", ")}</Text>
      <Image
        style={{ width: 100, height: 100 }}
        source={track.item.album.images[0]?.url}
      />
    </View>
  );
}

export default function User() {
  const { accessToken } = useSpotifyAuth();
  const { data: track, refetch } = api.spotify.getCurrenlyPlaying.useQuery({
    accessToken,
  });

  return (
    <View>
      {track && <TrackPreview track={track} />}
      <Button onPress={() => refetch()} title="Refresh" />
    </View>
  );
}
