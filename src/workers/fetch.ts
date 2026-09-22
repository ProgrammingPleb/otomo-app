import { getLatestDbStreams, refreshChannels, refreshStreams } from '@/utils/db';
import { getLatestChannels, getLatestVideos } from '@/utils/fetch';
import { processStreamNotifications } from '@/utils/notifications';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from "expo-task-manager";

export const FETCH_TASK_IDENTIFIER = "data-fetch";

export async function dataFetchBackgroundJob() {
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
}

export async function registerBackgroundDataFetch() {
    return BackgroundTask.registerTaskAsync(FETCH_TASK_IDENTIFIER, {
        minimumInterval: 15
    });
}

export async function unregisterBackgroundDataFetch() {
    return BackgroundTask.unregisterTaskAsync(FETCH_TASK_IDENTIFIER);
}

export async function isBackgroundDataFetchActive() {
    return await TaskManager.isTaskRegisteredAsync(FETCH_TASK_IDENTIFIER);
}
