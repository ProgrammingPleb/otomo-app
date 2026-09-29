import { AppText as Text } from "@/components/text";
import { getLatestDbStreams, updateLastCheckedTime } from "@/utils/db";
import { CHANNELS_BUFFER_NAME, STREAMS_BUFFER_NAME } from "@/utils/fetch";
import { requestExcludeBatteryOptimization, sendInstantNotification } from "@/utils/notifications";
import { setStringAsync } from "expo-clipboard";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { updateId, useUpdates } from "expo-updates";
import { ReactNode, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useCSSVariable } from "uniwind";

export default function DebugPage() {
    const router = useRouter();
    const easUpdateStatus = useUpdates();
    const onPrimary = useCSSVariable("--color-on-primary") as string;

    return (
        <View className="flex-1 py-safe px-4 bg-surface">
            <ScrollView contentContainerClassName="gap-3">
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
                </View>
                <View className="gap-2">
                    <Text className="text-on-surface text-2xl" weight="bold">Details</Text>
                    <Pressable onPress={async () => { if (updateId) await setStringAsync(updateId) }}>
                        <Text className="text-on-surface text-lg" weight="bold">EAS Update Build</Text>
                        <Text className="text-on-surface">{updateId ? updateId : "N/A"}</Text>
                    </Pressable>
                    <View>
                        <Text className="text-on-surface text-lg" weight="bold">EAS Update Available</Text>
                        <Text className="text-on-surface">{easUpdateStatus.isUpdateAvailable ? "Yes" : "No"}</Text>
                    </View>
                </View>
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

interface ActionSectionProps {
    title: string;
    description: ReactNode;
    action: string;
    onTap: () => void;
}

function ActionSection({ title, description, action, onTap }: ActionSectionProps) {
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
            >
                <Text weight="semibold" className="text-on-primary">{action}</Text>
            </Pressable>
        </View>
    )
}
