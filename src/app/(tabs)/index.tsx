import { AppText as Text } from "@/components/text";
import '@/global.css';
import { ScrollView, View } from "react-native";

export default function HomeTab() {
  return (
    <View className="flex-1 bg-surface pt-safe">
        <View>
          <Text className="text-on-surface text-3xl" weight="bold">Home</Text>
        </View>
      </ScrollView>
    </View>
  );
}
