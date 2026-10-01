import { handleNotificationTap } from "@/utils/notifications";
import { dataFetchBackgroundJob, FETCH_TASK_IDENTIFIER } from "@/workers/fetch";
import * as TaskManager from "expo-task-manager";
import Notifee from "react-native-notify-kit";

TaskManager.defineTask(FETCH_TASK_IDENTIFIER, async () => await dataFetchBackgroundJob());
Notifee.onBackgroundEvent(handleNotificationTap);
