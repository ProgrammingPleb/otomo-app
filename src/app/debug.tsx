import { AppText as Text } from "@/components/text";
import { getLatestDbStreams, updateLastCheckedTime } from "@/utils/db";
import { BACKEND_URL } from "@/utils/env";
import { CHANNELS_BUFFER_NAME, STREAMS_BUFFER_NAME } from "@/utils/fetch";
import { requestExcludeBatteryOptimization, sendInstantNotification } from "@/utils/notifications";
import { dataFetchBackgroundJob } from "@/workers/fetch";
import { setStringAsync } from "expo-clipboard";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { channel, runtimeVersion, updateId, useUpdates } from "expo-updates";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import Notifee, { TimestampTrigger, TriggerNotification } from "react-native-notify-kit";
import { useCSSVariable } from "uniwind";

export default function DebugPage() {
    const router = useRouter();
    const [refreshTime, setRefreshTime] = useState(Date.now());
    const onPrimary = useCSSVariable("--color-on-primary") as string;

    return (
        <View className="flex-1 py-safe bg-surface">
            <ScrollView contentContainerClassName="gap-4 px-4">
                <View className="flex-row gap-3">
                    <Pressable
                        className="self-center rounded-md p-2 bg-primary"
                        android_ripple={{ color: `${onPrimary}55` }}
                        onPress={() => router.back()}
                    >
                        <SymbolView
                            tintColor={onPrimary}
                            name={{
                                android: "arrow_back"
                            }}
                        />
                    </Pressable>
                    <View>
                        <Text className="text-on-surface text-3xl" weight="bold">Debug</Text>
                        <Text className="text-primary">Naked Naked So Just Break It Break It</Text>
                    </View>
                </View>
                <View className="gap-2">
                    <Text className="text-on-surface text-2xl" weight="bold">Actions</Text>
                    <BatteryOptimizationSection />
                    <NotificationTestSection />
                    <ClearTimers />
                    <RunBackgroundTask onRefresh={setRefreshTime} />
                </View>
                <AppDetailsSection />
                <EasDetailsSection />
                <ScheduledNotificationsSection refreshTime={refreshTime} />
            </ScrollView>
        </View>
    )
}

function BatteryOptimizationSection() {
    const [data, setData] = useState<boolean>();

    return (
        <ActionSection
            title="Check Battery Optimization"
            description={
                <View className="flex-row gap-1 -mt-1">
                    <Text className="text-on-surface">Status:</Text>
                    <Text className={data === undefined ? "text-secondary" : "text-primary"}>
                        {data === undefined ? "Not Tested" : data ? "Restricted" : "Unrestricted"}
                    </Text>
                </View>
            }
            action="Check"
            onTap={async () => setData(await requestExcludeBatteryOptimization())}
        />
    )
}

function NotificationTestSection() {
    return (
        <ActionSection
            title="Send Test Notification"
            description={
                <Text className="text-on-surface leading-5" numberOfLines={2}>
                    Picks the first stream in the list stream database as a reference.
                </Text>
            }
            action="Send"
            onTap={async () => {
                const streams = await getLatestDbStreams();
                await sendInstantNotification(streams[0], false);
            }}
        />
    )
}

function ClearTimers() {
    const [cleared, setCleared] = useState(false);

    return (
        <ActionSection
            title="Reset Fetch Buffers"
            description={
                <View>
                    <Text className="text-on-surface leading-5" numberOfLines={2}>
                        Clears the timers for all fetches.
                    </Text>
                    <View className="flex-row gap-1 -mt-1">
                        <Text className="text-on-surface">Status:</Text>
                        <Text className={!cleared ? "text-secondary" : "text-primary"}>
                            {cleared ? "Cleared" : "Not Done"}
                        </Text>
                    </View>
                </View>
            }
            action="Clear"
            onTap={async () => {
                await updateLastCheckedTime(STREAMS_BUFFER_NAME, 0);
                await updateLastCheckedTime(CHANNELS_BUFFER_NAME, 0);
                setCleared(true);
            }}
        />
    )
}

function RunBackgroundTask({ onRefresh }: { onRefresh: (newTime: number) => void }) {
    return (
        <ActionSection
            title="Run Background Task"
            description={
                <Text className="text-on-surface leading-5" numberOfLines={2}>
                    Forces an foreground run of the background task.
                </Text>
            }
            action="Execute"
            onTap={async () => {
                await dataFetchBackgroundJob();
                onRefresh(Date.now());
            }}
        />
    )
}

function AppDetailsSection() {
    return (
        <View className="gap-2">
            <Text className="text-on-surface text-2xl" weight="bold">App Details</Text>
            <Pressable onPress={async () => { await setStringAsync(BACKEND_URL) }}>
                <Text className="text-on-surface text-lg" weight="bold">Backend URL</Text>
                <Text className="text-on-surface">{BACKEND_URL}</Text>
            </Pressable>
        </View>
    );
}

function EasDetailsSection() {
    const easUpdateStatus = useUpdates();
    const updateStatus = useMemo(() => {
        if (easUpdateStatus.isChecking) {
            return "Checking";
        }
        if (easUpdateStatus.isDownloading) {
            return "Yes (Downloading)";
        }
        if (easUpdateStatus.isUpdatePending) {
            return "Yes (Pending Restart)";
        }
        if (easUpdateStatus.isUpdateAvailable) {
            return "Yes"
        }
        if (!updateId) {
            return "N/A";
        }
        return "No";
    }, [easUpdateStatus]);

    return (
        <View className="gap-2">
            <Text className="text-on-surface text-2xl" weight="bold">EAS Details</Text>
            <Pressable onPress={async () => { if (runtimeVersion) await setStringAsync(runtimeVersion) }}>
                <Text className="text-on-surface text-lg" weight="bold">Runtime Fingerprint</Text>
                <Text className="text-on-surface">{runtimeVersion ? runtimeVersion : "N/A"}</Text>
            </Pressable>
            <Pressable onPress={async () => { if (updateId) await setStringAsync(updateId) }}>
                <Text className="text-on-surface text-lg" weight="bold">Update Build</Text>
                <Text className="text-on-surface">{updateId ? updateId : "N/A"}</Text>
            </Pressable>
            <Pressable onPress={async () => { if (channel) await setStringAsync(channel) }}>
                <Text className="text-on-surface text-lg" weight="bold">Update Channel</Text>
                <Text className="text-on-surface">{channel ? channel : "N/A"}</Text>
            </Pressable>
            <View>
                <Text className="text-on-surface text-lg" weight="bold">Update Available</Text>
                <Text className="text-on-surface">{updateStatus}</Text>
            </View>
        </View>
    );
}

function ScheduledNotificationsSection({ refreshTime }: { refreshTime: number }) {
    const [notifications, setNotifications] = useState<TriggerNotification[]>([]);

    useEffect(() => {
        Notifee.getTriggerNotifications().then((notifications) =>
            setNotifications(notifications)
        );
    }, [refreshTime]);

    return (
        <View className="gap-2">
            <Text className="text-on-surface text-2xl" weight="bold">Scheduled Notifications</Text>
            {
                notifications.map((item) => (
                    <View key={`Notification - ${item.notification.id}`}>
                        <Text className="text-on-surface text-sm opacity-50">{item.notification.id}</Text>
                        <Text className="text-on-surface text-xl" weight="bold">{item.notification.title}</Text>
                        <Text className="text-on-surface leading-5 mt-0.5">{item.notification.body}</Text>
                        <Text className="text-on-surface opacity-50">
                            Trigger Time: {new Date((item.trigger as TimestampTrigger).timestamp).toLocaleString()}
                        </Text>
                    </View>
                ))
            }
        </View>
    );
}

interface ActionSectionProps {
    title: string;
    description: ReactNode;
    action: string;
    disabled?: boolean;
    onTap: () => void;
}

function ActionSection({ title, description, action, disabled = false, onTap }: ActionSectionProps) {
    const inversePrimary = useCSSVariable("--color-inverse-primary") as string;

    return (
        <View className="flex-row justify-between items-center gap-2">
            <View className="shrink">
                <Text className="text-on-surface text-lg" weight="bold">{title}</Text>
                {description}
            </View>
            <Pressable
                className={`flex flex-row gap-1 bg-primary px-4 py-2.5 rounded-md`}
                android_ripple={{ color: `${inversePrimary}55` }}
                onPress={onTap}
                disabled={disabled}
                style={{ opacity: disabled ? 0.6 : 1 }}
            >
                <Text weight="semibold" className="text-on-primary">{action}</Text>
            </Pressable>
        </View>
    )
}
