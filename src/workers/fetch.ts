import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from "expo-task-manager";

export const FETCH_TASK_IDENTIFIER = "data-fetch";

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
