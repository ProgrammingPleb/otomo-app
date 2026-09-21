import { db, DB_NAME, expo, getLatestDbStreams, refreshChannels, refreshStreams } from "@/utils/db";
import { getLatestChannels, getLatestVideos } from "@/utils/fetch";
import { getOpenReason, openStream, processStreamNotifications, registerNotificationChannels } from "@/utils/notifications";
import { FETCH_TASK_IDENTIFIER } from "@/workers/fetch";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import * as BackgroundTask from "expo-background-task";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import * as TaskManager from "expo-task-manager";
import { useEffect } from "react";
import Notifee, { EventType } from "react-native-notify-kit";
import { SafeAreaListener } from "react-native-safe-area-context";
import { Uniwind } from "uniwind";
import migrations from "../../drizzle/migrations";

TaskManager.defineTask(FETCH_TASK_IDENTIFIER, async () => {
    try {
        const channels = await getLatestChannels();
        if (channels) {
            await refreshChannels(channels);
        }

        const videos = await getLatestVideos();
        if (videos) {
            await refreshStreams(videos);
        }

        const streams = await getLatestDbStreams();
        await processStreamNotifications(streams);
        return BackgroundTask.BackgroundTaskResult.Success;
    } catch (e) {
        console.error("Data Fetch (BG): Unable to fetch the latest data!", e);
        return BackgroundTask.BackgroundTaskResult.Failed;
    }
});

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
        </Stack>
      </SafeAreaListener>
    </SQLiteProvider>
  );
}
