import FavoritesScreenshot from "@/assets/images/screenshots/favorites.png";
import { Image } from "@/components/image";
import { AppText as Text } from "@/components/text";
import { getSettings, setSettings } from "@/utils/db";
import { requestNotificationsPermissions } from "@/utils/notifications";
import { registerBackgroundDataFetch } from "@/workers/fetch";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { useCSSVariable } from "uniwind";

export default function OnboardingFavoritesPage() {
    const onPrimary = useCSSVariable("--color-on-primary") as string;

    return (
        <View className="flex-1 py-safe-offset-2 bg-surface px-4">
            <View className="flex-1 justify-center items-center gap-8">
                <Text className="text-primary text-4xl" weight="bold">Notifications</Text>
                <View className="p-2 bg-primary-container rounded-md">
                    <Image
                        source={FavoritesScreenshot}
                        className="w-80 rounded-md aspect-1008/1221"
                    />
                </View>
                <View>
                    <Text className="text-center text-on-surface">Add your oshis in the Favorites page!</Text>
                    <Text className="text-center text-on-surface leading-5 mt-1">
                        By allowing the app to post notifications, you will be able to get notifications when they go live!
                    </Text>
                    <Text className="text-center text-on-surface">Add your oshis in the Favorites page!</Text>
                </View>
            </View>
            <Pressable
                className="rounded-md p-2 bg-primary items-center"
                android_ripple={{ color: `${onPrimary}55` }}
                onPress={async () => {
                    const settings = await getSettings();
                    const allowed = await requestNotificationsPermissions();
                    if (allowed) {
                        await registerBackgroundDataFetch();
                        await setSettings({ ...settings, notificationsEnabled: allowed });
                    }
                    router.push("/onboarding/streams");
                }}
            >
                <Text className="text-on-primary">Allow Notifications</Text>
            </Pressable>
        </View>
    )
}