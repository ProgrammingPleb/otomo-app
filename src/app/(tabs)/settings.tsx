import { AppTextInput as TextInput } from "@/components/input";
import { AppText as Text } from "@/components/text";
import '@/global.css';
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useCSSVariable } from "uniwind";

export default function SettingsTab() {
  const onPrimary = useCSSVariable("--color-on-primary") as string;
  const onPrimaryContainer = useCSSVariable("--color-on-primary-container") as string;
  const inversePrimary = useCSSVariable("--color-inverse-primary") as string;

  const [needsSave, setNeedsSave] = useState(true);

  return (
    <View className="flex-1 bg-background pt-safe">
      <ScrollView className="flex-1 px-4">
        <View>
          <Text className="text-on-background text-3xl" weight="bold">Settings</Text>
          <Text className="text-primary">Set your preferences of the app here.</Text>
        </View>
        <View className="flex gap-2">
          <TextInput
            title="Holodex API Key"
            titleClassName="text-on-background"
            placeholder="Input Holodex API key here."
            hint="Use this to avoid rate limits."
          />
          <Pressable
            className={`flex flex-row gap-1 ${needsSave ? "bg-primary" : "bg-primary-container opacity-60"} self-start px-4 py-2.5 rounded-md`}
            android_ripple={needsSave ? { color: inversePrimary } : undefined}
            onPress={() => {
              setNeedsSave(false);
            }}
          >
            <SymbolView
              tintColor={needsSave ? onPrimary : onPrimaryContainer}
              name={{
                android: "save"
              }}
            />
            <Text weight="semibold" className={needsSave ? "text-on-primary" : "text-on-primary-container"}>Save</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
