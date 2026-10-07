import '@/global.css';
import { db, DB_NAME, expo } from "@/utils/db";
import { getOpenReason, handleNotificationTap, openPendingStream, registerNotificationChannels } from "@/utils/notifications";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { checkForUpdateAsync, fetchUpdateAsync } from "expo-updates";
import { useEffect, useMemo } from "react";
import { AppState } from 'react-native';
import Notifee from "react-native-notify-kit";
import { SafeAreaListener } from "react-native-safe-area-context";
import { Uniwind } from "uniwind";
import { settingsTable } from "../../db/schema";
import migrations from "../../drizzle/migrations";

export default function RootLayout() {
  useDrizzleStudio(expo);
  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    if (!success) {
      console.log(error);
    }
  }, [success, error]);
  useEffect(() => {
    registerNotificationChannels();
    getOpenReason().catch((e) => console.error(`Notification: Unable to get app open reason!`, e));

    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state == "active") {
        openPendingStream().catch((e) =>
          console.error("Notification: Unable to open pending stream!", e)
        )
        if (!__DEV__) {
          checkForUpdateAsync()
            .then((value) => {
              if (value.isAvailable) {
                fetchUpdateAsync().catch((e) =>
                  console.error("Updates: Unable to download the latest update from Expo!", e)
                )
              }
            }).catch((e) =>
              console.error("Updates: Unable to check for updates from Expo!", e)
            )
        }
      }
    });
    const unsubscribeNotifeeForeground = Notifee.onForegroundEvent(handleNotificationTap);

    return () => {
      appStateSub.remove();
      unsubscribeNotifeeForeground();
    };
  }, []);

  return (
    <SQLiteProvider databaseName={DB_NAME}>
      <SafeAreaListener onChange={({ insets }) => {
        Uniwind.updateInsets(insets);
      }}>
        <AppNavStack />
      </SafeAreaListener>
    </SQLiteProvider>
  );
}

function AppNavStack() {
  const data = useLiveQuery(db.select().from(settingsTable));

  const isOnboardingDone = useMemo(() => {
    let completed = false;
    if (data.updatedAt) {
      for (const row of data.data) {
        if (row.key == "onboardingDone") {
          completed = row.value == "1";
        }
      }
      return completed;
    }
  }, [data]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isOnboardingDone !== undefined}>
        <Stack.Protected guard={!isOnboardingDone}>
          <Stack.Screen name="onboarding/welcome" />
          <Stack.Screen name="onboarding/favorites" />
          <Stack.Screen name="onboarding/streams" />
        </Stack.Protected>
        <Stack.Protected guard={isOnboardingDone!}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="add_favorites" />
          <Stack.Screen name="notifications/settings_prompt" />
          <Stack.Screen name="debug" />
        </Stack.Protected>
      </Stack.Protected>
    </Stack>
  );
}
