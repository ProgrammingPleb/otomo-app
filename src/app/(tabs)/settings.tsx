import { AppTextInput as TextInput } from "@/components/input";
import { AppText as Text } from "@/components/text";
import '@/global.css';
import { SettingsData } from "@/model/settings";
import { getSettings, refreshChannels, setSettings } from "@/utils/db";
import { getLatestChannels } from "@/utils/fetch";
import { SymbolView } from "expo-symbols";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useCSSVariable } from "uniwind";

export default function SettingsTab() {
  const onPrimary = useCSSVariable("--color-on-primary") as string;
  const onPrimaryContainer = useCSSVariable("--color-on-primary-container") as string;
  const inversePrimary = useCSSVariable("--color-inverse-primary") as string;
  const originalSettings = useRef<SettingsData>({ apiKey: "" });

  const [apiKey, setApiKey] = useState("");

  function needsSave() {
    const settings = originalSettings.current;

    return apiKey != settings.apiKey;
  }

  useEffect(() => {
    getSettings().then((settings) => {
      originalSettings.current = settings;
      setApiKey(settings.apiKey);
    });
  }, []);

  return (
    <View className="flex-1 bg-surface pt-safe">
      <ScrollView className="flex-1 px-4">
        <View>
          <Text className="text-on-surface text-3xl" weight="bold">Settings</Text>
          <Text className="text-primary">Set your preferences of the app here.</Text>
        </View>
        <View className="flex gap-2">
          <TextInput
            title="Holodex API Key"
            titleClassName="text-on-surface"
            className="text-on-surface"
            placeholder="Input Holodex API key here."
            hint="Use this to avoid rate limits."
            value={apiKey}
            onChangeText={(input) => setApiKey(input)}
          />
          <Pressable
            className={`flex flex-row gap-1 ${needsSave() ? "bg-primary" : "bg-primary-container opacity-60"} self-start px-4 py-2.5 rounded-md`}
            android_ripple={needsSave() ? { color: `${inversePrimary}55` } : undefined}
            onPress={() => {
              if (needsSave()) {
                setSettings({ apiKey: apiKey }).then(() => {
                  originalSettings.current = { apiKey: apiKey };
                });
              }
            }}
          >
            <SymbolView
              tintColor={needsSave() ? onPrimary : onPrimaryContainer}
              name={{
                android: "save"
              }}
            />
            <Text weight="semibold" className={needsSave() ? "text-on-primary" : "text-on-primary-container"}>Save</Text>
          </Pressable>
          <Pressable
            className={`flex flex-row gap-1 bg-primary self-start px-4 py-2.5 rounded-md`}
            android_ripple={{ color: `${inversePrimary}55` }}
            onPress={async () => {
              const channels = await getLatestChannels();
              await refreshChannels(channels);
            }}
          >
            <SymbolView
              tintColor={onPrimary}
              name={{
                android: "refresh"
              }}
            />
            <Text weight="semibold" className="text-on-primary">Refresh Current Channels</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
