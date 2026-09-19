import { refreshChannels, refreshStreams } from "@/utils/db";
import { getLatestChannels, getLatestVideos, getOneChannel } from "@/utils/fetch";
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from "expo-task-manager";

const FETCH_TASK_IDENTIFIER = "data-fetch";

TaskManager.defineTask(FETCH_TASK_IDENTIFIER, async () => {
    try {
        const videos = await getLatestVideos();
        if (videos) {
            await refreshStreams(videos, async (channelId) => await getOneChannel(channelId));
        }

        const channels = await getLatestChannels();
        if (channels) {
            await refreshChannels(channels);
        }
        return BackgroundTask.BackgroundTaskResult.Success;
    } catch (e) {
        console.error("Data Fetch (BG): Unable to fetch the latest data!", e);
        return BackgroundTask.BackgroundTaskResult.Failed;
    }
});

export async function registerBackgroundDataFetch() {
    return BackgroundTask.registerTaskAsync(FETCH_TASK_IDENTIFIER, {
        minimumInterval: 30
    });
}

export async function unregisterBackgroundDataFetch() {
    return BackgroundTask.unregisterTaskAsync(FETCH_TASK_IDENTIFIER);
}

export async function isBackgroundDataFetchActive() {
    return await TaskManager.isTaskRegisteredAsync(FETCH_TASK_IDENTIFIER);
}
