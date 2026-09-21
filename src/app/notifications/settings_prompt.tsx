import SettingsScreenshot from "@/assets/images/otomo-notification-settings.png";
import { Image } from "@/components/image";
import { AppText as Text } from "@/components/text";
import { getNotificationsPermissionsStatus } from "@/utils/notifications";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect } from "react";
import { AppState, Linking, Pressable, View } from "react-native";
import { useCSSVariable } from "uniwind";

export default function NotificationsSettingsGuidePrompt() {
    const router = useRouter();
    const onPrimary = useCSSVariable("--color-on-primary") as string;

    useEffect(() => {
        const focusSub = AppState.addEventListener("change", async (state) => {
            if (state === "active") {
                const status = await getNotificationsPermissionsStatus();
                if (status == "granted") {
                    router.back();
                }
            }
        });

        return () => {
            focusSub.remove();
        }
    }, []);

    return (
        <View className="flex-1 py-safe bg-surface">
            <View className="flex-1 justify-between px-4 pb-4">
                <View className="gap-4">
                    <View className="flex-row items-center gap-4">
                        <View>
                            <Pressable
                                className="rounded-md p-2 bg-primary"
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
                        </View>
                        <View>
                            <Text className="text-3xl text-on-surface" weight="bold">Enable Notifications</Text>
                            <Text className="text-primary">To be enabled in system settings.</Text>
                        </View>
                    </View>
                    <Text className="text-on-surface shrink leading-5">
                        {
                            "If you are looking at this, then you might have pressed \"Don't Allow\" multiple times during " +
                            "the notification prompts.\n" +
                            "Don't worry as you will be able to enable them manually within the Settings app!"
                        }
                    </Text>
                    <View>
                        <View>
                            <Text className="text-on-surface text-xl" weight="bold">How to Enable?</Text>
                            <Text className="text-on-surface">Tap on "All Otomo notifications" to enable notifications.</Text>
                        </View>
                        <View className="flex-1 rounded-md mt-1">
                            <Image
                                className="w-full"
                                style={{ aspectRatio: 1008 / 857 }}
                                source={SettingsScreenshot}
                                contentFit="contain"
                            />
                        </View>
                    </View>
                </View>

                <Pressable
                    className="bg-primary rounded-md items-center p-2"
                    android_ripple={{ color: `${onPrimary}55` }}
                    onPress={async () =>
                        await Linking.sendIntent('android.settings.APP_NOTIFICATION_SETTINGS', [
                            {
                                key: 'android.provider.extra.APP_PACKAGE',
                                value: 'moe.pleb.otomo',
                            },
                        ])
                    }
                >
                    <Text className="text-on-primary" weight="medium">Open Settings</Text>
                </Pressable>
            </View>
        </View>
    )
}
