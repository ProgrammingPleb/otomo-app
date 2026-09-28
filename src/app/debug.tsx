import { AppText as Text } from "@/components/text";
import { getLatestDbStreams } from "@/utils/db";
import { requestExcludeBatteryOptimization, sendInstantNotification } from "@/utils/notifications";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useCSSVariable } from "uniwind";

export default function DebugPage() {
    const router = useRouter();
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
                </View>
            </ScrollView>
        </View>
    )
}

function BatteryOptimizationSection() {
    const [data, setData] = useState<boolean>();
    const inversePrimary = useCSSVariable("--color-inverse-primary") as string;

    return (
        <View className="flex-row justify-between items-center">
            <View>
                <Text className="text-on-surface text-lg" weight="bold">Check Battery Optimization</Text>
                <View className="flex-row gap-1 -mt-1">
                    <Text className="text-on-surface">Status:</Text>
                    <Text className={data === undefined ? "text-secondary" : "text-primary"}>
                        {data === undefined ? "Not Tested" : data ? "Restricted" : "Unrestricted"}
                    </Text>
                </View>
            </View>
            <Pressable
                className={`flex flex-row gap-1 bg-primary px-4 py-2.5 rounded-md`}
                android_ripple={{ color: `${inversePrimary}55` }}
                onPress={async () => {
                    setData(await requestExcludeBatteryOptimization());
                }}
            >
                <Text weight="semibold" className="text-on-primary">Test</Text>
            </Pressable>
        </View>
    )
}

function NotificationTestSection() {
    const inversePrimary = useCSSVariable("--color-inverse-primary") as string;

    return (
        <View className="flex-row justify-between items-center gap-2">
            <View className="shrink">
                <Text className="text-on-surface text-lg" weight="bold">Send Test Notification</Text>
                <Text className="text-on-surface leading-5" numberOfLines={2}>
                    Picks the first stream in the list stream database as a reference.
                </Text>
            </View>
            <Pressable
                className={`flex flex-row gap-1 bg-primary px-4 py-2.5 rounded-md`}
                android_ripple={{ color: `${inversePrimary}55` }}
                onPress={async () => {
                    const streams = await getLatestDbStreams();
                    await sendInstantNotification(streams[0], false);
                }}
            >
                <Text weight="semibold" className="text-on-primary">Test</Text>
            </Pressable>
        </View>
    )
}
