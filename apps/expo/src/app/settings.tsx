import { Pressable, Switch, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

import { useAutoPlay } from "~/utils/autoplay";

function Divider() {
  return <View className="border-t border-gray-200" />;
}

export default function Index() {
  const { isAutoPlay, setIsAutoPlay } = useAutoPlay();

  return (
    <View>
      <Pressable className="flex flex-row items-center justify-between p-4">
        <Text className="text-lg">Autoplay</Text>
        <Switch
          value={isAutoPlay}
          onValueChange={() => setIsAutoPlay(!isAutoPlay)}
        />
      </Pressable>
      <Divider />
      <View className="flex flex-row items-center justify-between p-4 active:bg-gray-200">
        <Text className="text-lg">Logout</Text>
        <FontAwesome name="sign-out" size={20} color="black" />
      </View>
    </View>
  );
}
