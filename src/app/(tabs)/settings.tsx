import OtomoLogo from "@/assets/images/github-icon.png";
import { Image } from "@/components/image";
import { SettingsSwitch } from "@/components/settings";
import { AppText as Text } from "@/components/text";
import { UpdateBox } from "@/components/update";
import '@/global.css';
import { SettingsData } from "@/model/settings";
import { DEFAULT_SETTINGS, getSettings, setSettings } from "@/utils/db";
import { cancelUpcomingNotifications, getNotificationsPermissionsStatus, requestExcludeBatteryOptimization, requestNotificationsPermissions } from "@/utils/notifications";
import { isBackgroundDataFetchActive, registerBackgroundDataFetch, unregisterBackgroundDataFetch } from "@/workers/fetch";
import { nativeApplicationVersion } from "expo-application";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

export default function SettingsTab() {
  const router = useRouter();
  const [originalSettings, setOriginalSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const manualSettingsSet = useRef(false);
  const [dataFetchActive, setDataFetchActive] = useState(false);

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
    });
    isBackgroundDataFetchActive().then((active) => {
      setDataFetchActive(active);
    })
  }, []);

  return (
    <View className="flex-1 bg-surface pt-safe">
      <ScrollView className="flex-1 px-4">
        <View className="mt-4">
          <View className="flex-row justify-center items-center gap-4">
            <Pressable onLongPress={() => router.push("/debug")}>
              <Image
                source={OtomoLogo}
                className="w-28 aspect-square"
              />
            </Pressable>
            <View>
              <Text className="text-3xl text-on-surface" weight="bold">Otomo</Text>
              <Text className="text-primary -mt-1">by @ProgrammingPleb</Text>
              <Text className="text-secondary">v{nativeApplicationVersion}</Text>
            </View>
          </View>
        </View>
        <View className="flex gap-2 py-3 mb-4">
          <Text className="text-2xl text-on-surface" weight="bold">Settings</Text>
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
        <UpdateBox />
      </ScrollView>
    </View>
  );
}
