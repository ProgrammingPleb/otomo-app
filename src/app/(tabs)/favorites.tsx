import { AppText as Text } from "@/components/text";
import '@/global.css';
import { ScrollView, View } from "react-native";

export default function FavoritesTab() {
  return (
    <View className="flex-1 bg-surface pt-safe">
      <ScrollView className="flex-1 px-4">
        <View>
          <Text className="text-on-surface text-3xl" weight="bold">Favorites</Text>
          <Text className="text-primary">Show off your oshi list!</Text>
        </View>
      </ScrollView>
    </View>
  );
}
