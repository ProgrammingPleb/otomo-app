import { getConnection } from "@/utils/db";
import * as TaskManager from "expo-task-manager";

export const FETCH_TASK_IDENTIFIER = "data-fetch";

TaskManager.defineTask(FETCH_TASK_IDENTIFIER, async () => {
    try {
        const db = await getConnection();
    } catch (e) {
        console.error("Data Fetch (BG): Unable to fetch the latest data!", e);
    }
})