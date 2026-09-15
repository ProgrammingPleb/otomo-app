import { AppTextInput as TextInput } from "@/components/input";
import { AppText as Text } from "@/components/text";
import '@/global.css';
import { ScrollView, View } from "react-native";

export default function SettingsTab() {
  return (
    <View className="flex-1 bg-background pt-safe">
      <ScrollView className="flex-1 px-4">
        <View>
          <Text className="text-on-background text-3xl" weight="bold">Settings</Text>
          <Text className="text-primary">Set your preferences of the app here.</Text>
        </View>
        <TextInput
          title="Holodex API Key"
          titleClassName="text-on-background"
          placeholder="Input Holodex API key here."
          hint="Use this to avoid rate limits."
        />
      </ScrollView>
    </View>
  );
}
