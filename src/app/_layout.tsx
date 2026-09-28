import { db, DB_NAME, expo } from "@/utils/db";
import { getOpenReason, openStream, registerNotificationChannels } from "@/utils/notifications";
import { dataFetchBackgroundJob, FETCH_TASK_IDENTIFIER } from "@/workers/fetch";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import * as TaskManager from "expo-task-manager";
import { useEffect } from "react";
import Notifee, { EventType } from "react-native-notify-kit";
import { SafeAreaListener } from "react-native-safe-area-context";
import { Uniwind } from "uniwind";
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
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="add_favorites" />
          <Stack.Screen name="notifications/settings_prompt" />
          <Stack.Screen name="debug" />
        </Stack>
      </SafeAreaListener>
    </SQLiteProvider>
  );
}
