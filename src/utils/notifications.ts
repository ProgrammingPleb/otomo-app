import { AppVideo } from "@/model/app";
import { isBatteryOptimizationEnabledAsync } from "expo-battery";
import Constants from "expo-constants";
import { ActivityAction, startActivityAsync } from "expo-intent-launcher";
import { Linking } from "react-native";
import Notifee, { AndroidStyle, AndroidVisibility, AuthorizationStatus, Notification, TimestampTrigger, TriggerType } from "react-native-notify-kit";
import { getFavoritedChannels, getSettings, resetUpcomingNotifications, setSettings, updateStreamNotification } from "./db";

const SCHEDULE_BUFFER_MINUTES = 30;
const UPCOMING_SEND_BEFORE_MINUTES = 10;

const UPCOMING_CHANNEL_ID = "upcoming";
const LIVE_CHANNEL_ID = "live";

type NotificationsPermissionsStatus = "granted" | "prompt" | "settings";

export async function getOpenReason() {
    const initNotification = await Notifee.getInitialNotification();

    if (initNotification) {
        openStream(initNotification.notification.data?.videoId as string | undefined);
    }
}

export function openStream(videoId: string | undefined) {
    if (videoId) {
        Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
    }
}

export async function registerNotificationChannels() {
    await Notifee.createChannel({
        id: UPCOMING_CHANNEL_ID,
        name: "Scheduled Streams",
        description: "Streams that are scheduled in advance.",
        visibility: AndroidVisibility.PUBLIC,
        sound: "default"
    });
    await Notifee.createChannel({
        id: LIVE_CHANNEL_ID,
        name: "Live Streams",
        description: "Streams that go live when they start.",
        visibility: AndroidVisibility.PUBLIC,
        sound: "default"
    });
}

export async function requestNotificationsPermissions() {
    const settings = await getSettings();
    if (!settings.notificationsPrompted) {
        await setSettings({ ...settings, notificationsPrompted: true });
    }
    const resp = await Notifee.requestPermission();
    await requestExcludeBatteryOptimization();

    return resp.authorizationStatus == AuthorizationStatus.AUTHORIZED;
}

export async function getNotificationsPermissionsStatus(): Promise<NotificationsPermissionsStatus> {
    const settings = await getSettings();
    const permissions = await Notifee.getNotificationSettings();

    if (permissions.authorizationStatus == AuthorizationStatus.AUTHORIZED) {
        return "granted";
    }
    if (
        permissions.authorizationStatus == AuthorizationStatus.NOT_DETERMINED ||
        (permissions.authorizationStatus == AuthorizationStatus.DENIED && !settings.notificationsPrompted)
    ) {
        return "prompt";
    }

    return "settings";
}

function notificationConfig(stream: AppVideo, upcoming: boolean, data: { [key: string]: number | string }): Notification {
    return {
        android: {
            channelId: upcoming ? UPCOMING_CHANNEL_ID : LIVE_CHANNEL_ID,
            smallIcon: "logo",
            style: {
                type: AndroidStyle.BIGPICTURE,
                picture: `https://img.youtube.com/vi/${stream.video_id}/maxresdefault.jpg`
            },
            largeIcon: stream.channel.profile_picture,
            circularLargeIcon: true
        },
        id: stream.video_id,
        title: upcoming ? `${stream.channel.name}'s stream is about to start!` : `${stream.channel.name} is now live!`,
        body: stream.title,
        data: data
    };
}

export async function sendInstantNotification(stream: AppVideo, upcoming: boolean) {
    await Notifee.displayNotification(notificationConfig(
        stream,
        upcoming,
        {
            videoId: stream.video_id
        }
    ));
}

export async function sendScheduledNotification(stream: AppVideo) {
    const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: stream.start_scheduled! - (UPCOMING_SEND_BEFORE_MINUTES * 60 * 1000)
    }

    await Notifee.createTriggerNotification(notificationConfig(
        stream,
        true,
        {
            videoId: stream.video_id,
            timeStart: stream.start_scheduled!
        }
    ), trigger);
}

export async function cancelUpcomingNotifications() {
    const streamIds = await Notifee.getTriggerNotificationIds();
    if (streamIds.length > 0) {
        await Notifee.cancelTriggerNotifications(streamIds);
        await resetUpcomingNotifications(streamIds);
    }
}

export async function processStreamNotifications(streams: AppVideo[]) {
    const settings = await getSettings();
    const currentTime = new Date().getTime();

    if (!settings.notificationsEnabled) {
        await cancelUpcomingNotifications();
        return;
    }

    const favoritedChannelsData = await getFavoritedChannels();
    if (!favoritedChannelsData) {
        return;
    }
    const favoriteChannels = new Set(favoritedChannelsData.map((channel) => channel.id));
    const scheduledStreams = await Notifee.getTriggerNotifications();

    for (const stream of streams) {
        try {
            if (!favoriteChannels.has(stream.channel.id)) {     // Filter out the non-favorited channels
                continue;
            }
            if (stream.notification == "now") {        // Filter out the ones that have already been sent out as live notifications
                continue;
            }

            const scheduled = scheduledStreams.find((item) => stream.video_id == item.notification.id);
            if (scheduled) {
                const compareTime = scheduled.notification.data?.timeStart as number | undefined;
                if (stream.start_actual && currentTime > stream.start_actual) {
                    await Notifee.cancelTriggerNotification(scheduled.notification.id!);
                    await sendInstantNotification(stream, false);
                    await updateStreamNotification(stream.video_id, "now");
                } else if (compareTime && compareTime != stream.start_scheduled) {
                    await Notifee.cancelTriggerNotification(scheduled.notification.id!);
                    if (stream.start_scheduled) {
                        if (stream.start_scheduled - currentTime < UPCOMING_SEND_BEFORE_MINUTES * 60 * 1000) {
                            await sendInstantNotification(stream, true);
                            await updateStreamNotification(stream.video_id, "soon");
                        } else {
                            await sendScheduledNotification(stream);
                            await updateStreamNotification(stream.video_id, "soon");
                        }
                    } else {
                        await updateStreamNotification(stream.video_id, "none");
                    }
                }
                continue;
            }
            if (
                stream.notification == "none" &&
                stream.start_actual &&
                stream.start_actual < currentTime &&
                stream.start_actual + (SCHEDULE_BUFFER_MINUTES * 60 * 1000) > currentTime
            ) {     // Only send "Live now" on streams that were not processed and first seen as live
                await sendInstantNotification(stream, false);
                await updateStreamNotification(stream.video_id, "now");
                continue;
            }
            if (
                stream.start_scheduled &&
                stream.notification == "none"
            ) {
                const scheduleDifference = stream.start_scheduled - currentTime;
                // Only schedule streams that are upcoming around 30 minutes
                if (scheduleDifference > 0) {
                    if (scheduleDifference < UPCOMING_SEND_BEFORE_MINUTES * 60 * 1000) {
                        await sendInstantNotification(stream, true);
                        await updateStreamNotification(stream.video_id, "soon");
                        continue;
                    }
                    if (scheduleDifference < SCHEDULE_BUFFER_MINUTES * 60 * 1000) {
                        await sendScheduledNotification(stream);
                        await updateStreamNotification(stream.video_id, "soon");
                        continue;
                    }
                }
            }
        } catch (e) {
            console.error(`Unable to process notifications for "${stream.video_id}"!`, e);
        }
    }
}

export async function requestExcludeBatteryOptimization() {
    const batteryOptimizationEnabled = await isBatteryOptimizationEnabledAsync();
    const appId = Constants.expoConfig?.android?.package;
    console.log(batteryOptimizationEnabled);
    console.log(appId)
    if (batteryOptimizationEnabled && appId) {
        await startActivityAsync(ActivityAction.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, {
            data: `package:${appId}`
        });

        return await isBatteryOptimizationEnabledAsync();
    }

    return batteryOptimizationEnabled;
}
