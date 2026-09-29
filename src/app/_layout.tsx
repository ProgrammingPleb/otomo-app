import '@/global.css';
import { db, DB_NAME, expo } from "@/utils/db";
import { getOpenReason, openStream, registerNotificationChannels } from "@/utils/notifications";
import { dataFetchBackgroundJob, FETCH_TASK_IDENTIFIER } from "@/workers/fetch";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import * as TaskManager from "expo-task-manager";
import { useEffect, useMemo } from "react";
import Notifee, { EventType } from "react-native-notify-kit";
import { SafeAreaListener } from "react-native-safe-area-context";
import { Uniwind } from "uniwind";
import { settingsTable } from "../../db/schema";
import migrations from "../../drizzle/migrations";

TaskManager.defineTask(FETCH_TASK_IDENTIFIER, async () => await dataFetchBackgroundJob());

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
    getOpenReason();

    return Notifee.onForegroundEvent(({ type, detail }) => {
      if (type == EventType.PRESS) {
        openStream(detail.notification?.data?.videoId as string | undefined);
      }
    })
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
