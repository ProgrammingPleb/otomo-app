import { SettingsSwitch } from "@/components/settings";
import { AppText as Text } from "@/components/text";
import '@/global.css';
import { SettingsData } from "@/model/settings";
import { DEFAULT_SETTINGS, getLatestDbStreams, getSettings, setSettings } from "@/utils/db";
import { cancelUpcomingNotifications, getNotificationsPermissionsStatus, requestExcludeBatteryOptimization, requestNotificationsPermissions, sendInstantNotification } from "@/utils/notifications";
import { isBackgroundDataFetchActive, registerBackgroundDataFetch, unregisterBackgroundDataFetch } from "@/workers/fetch";
import { useFocusEffect, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useCSSVariable } from "uniwind";

export default function SettingsTab() {
  const router = useRouter();
  const onPrimary = useCSSVariable("--color-on-primary") as string;
  const inversePrimary = useCSSVariable("--color-inverse-primary") as string;
  const [originalSettings, setOriginalSettings] = useState<SettingsData>(DEFAULT_SETTINGS);

  const manualSettingsSet = useRef(false);
  const [apiKey, setApiKey] = useState("");
  const [dataFetchActive, setDataFetchActive] = useState(false);

  function needsSave() {
    return apiKey != originalSettings.apiKey;
  }

  const handleToggleBackgroundDataFetch = useCallback(async (enable: boolean) => {
    if (enable) {
      await registerBackgroundDataFetch();
    } else {
      await unregisterBackgroundDataFetch();
      await cancelUpcomingNotifications();
      const newSettings: SettingsData = { ...originalSettings, notificationsEnabled: false };
      setOriginalSettings(newSettings);
      await setSettings(newSettings);
    }
    setDataFetchActive(enable);
  }, [originalSettings]);
  const handleNotificationsToggle = useCallback(async (enable: boolean) => {
    const newSettings: SettingsData = { ...originalSettings, notificationsEnabled: enable };
    let updateNeeded = !enable;
    if (enable) {
      const status = await getNotificationsPermissionsStatus();
      switch (status) {
        case "granted":
          await requestExcludeBatteryOptimization();
          updateNeeded = true;
          break;
        case "prompt":
          updateNeeded = await requestNotificationsPermissions();
          break;
        case "settings":
          router.push("/notifications/settings_prompt");
          manualSettingsSet.current = true;
          break;
      }
    } else {
      await cancelUpcomingNotifications();
    }
    if (updateNeeded) {
      setOriginalSettings(newSettings);
      await setSettings(newSettings);
    }
  }, [originalSettings]);

  useFocusEffect(() => {
    if (manualSettingsSet.current) {
      getNotificationsPermissionsStatus().then(async (status) => {
        if (status == "granted") {
          const newSettings: SettingsData = { ...originalSettings, notificationsEnabled: true };
          setOriginalSettings(newSettings);
          await setSettings(newSettings);
          await requestExcludeBatteryOptimization();
        }
      });
      manualSettingsSet.current = false;
    }
  });

  useEffect(() => {
    getSettings().then((settings) => {
      setOriginalSettings(settings);
      setApiKey(settings.apiKey);
    });
    isBackgroundDataFetchActive().then((active) => {
      setDataFetchActive(active);
    })
  }, []);

  return (
    <View className="flex-1 bg-surface pt-safe">
      <ScrollView className="flex-1 px-4">
        <View>
          <Text className="text-on-surface text-3xl" weight="bold">Settings</Text>
          <Text className="text-primary">Set your preferences of the app here.</Text>
        </View>
        <View className="flex gap-2">
          <Pressable
            className={`flex flex-row gap-1 bg-primary self-start px-4 py-2.5 rounded-md`}
            android_ripple={{ color: `${inversePrimary}55` }}
            onPress={async () => {
              await requestExcludeBatteryOptimization();
            }}
          >
            <SymbolView
              tintColor={onPrimary}
              name={{
                android: "battery_60"
              }}
            />
            <Text weight="semibold" className="text-on-primary">Check Battery Optimization</Text>
          </Pressable>
          <Pressable
            className={`flex flex-row gap-1 bg-primary self-start px-4 py-2.5 rounded-md`}
            android_ripple={{ color: `${inversePrimary}55` }}
            onPress={async () => {
              const streams = await getLatestDbStreams();
              await sendInstantNotification(streams[0], false);
            }}
          >
            <SymbolView
              tintColor={onPrimary}
              name={{
                android: "lab_research"
              }}
            />
            <Text weight="semibold" className="text-on-primary">Send Test Notification</Text>
          </Pressable>
          <SettingsSwitch
            title="Background Refresh"
            description="Refresh streams even when the app is closed."
            value={dataFetchActive}
            onValueChange={handleToggleBackgroundDataFetch}
          />
          <SettingsSwitch
            title="Stream Notifications"
            description="Receive notifications when streams are starting."
            value={originalSettings.notificationsEnabled}
            onValueChange={handleNotificationsToggle}
            enabled={dataFetchActive}
          />
        </View>
      </ScrollView>
    </View>
  );
}
