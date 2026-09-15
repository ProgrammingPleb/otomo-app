import { AppText as Text } from "@/components/text";
import '@/global.css';
import { ScrollView, View } from "react-native";

export default function HomeTab() {
  return (
    <View className="flex-1 bg-background pt-safe">
      <ScrollView className="flex-1 px-4">
        <View>
          <Text className="text-on-background text-3xl" weight="bold">Home</Text>
          <Text className="text-primary">Ongoing Live Streams: 0</Text>
        </View>
      </ScrollView>
    </View>
  );
}
