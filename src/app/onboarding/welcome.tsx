import OtomoLogo from "@/assets/images/github-icon.png";
import { Image } from "@/components/image";
import { AppText as Text } from "@/components/text";
import { refreshChannels, refreshStreams } from "@/utils/db";
import { getLatestChannels, getLatestVideos } from "@/utils/fetch";
import { useRouter } from "expo-router";
import { useCallback, useEffect } from "react";
import { Pressable, View } from "react-native";
import { useCSSVariable } from "uniwind";

export default function OnboardingWelcomePage() {
    const router = useRouter();
    const onPrimary = useCSSVariable("--color-on-primary") as string;

    const refreshStreamsList = useCallback(async () => {
        const channels = await getLatestChannels();
        if (channels) {
          await refreshChannels(channels);
        }
        const videos = await getLatestVideos();
        if (videos) {
          await refreshStreams(videos);
        }
      }, []);
    
      useEffect(() => {
        refreshStreamsList();
      }, []);

    return (
        <View className="flex-1 py-safe-offset-2 bg-surface px-4">
            <View className="flex-1 justify-center items-center gap-8">
                <Text className="text-primary text-5xl" weight="bold">ようこそ！</Text>
                <Image
                    source={OtomoLogo}
                    className="w-36 aspect-square"
                />
                <View>
                    <Text className="text-center text-on-surface">Thank you for installing Otomo!</Text>
                    <Text className="text-center text-on-surface">Please head to the next page to set up certain features.</Text>
                </View>
            </View>
            <Pressable
                className="rounded-md p-2 bg-primary items-center"
                android_ripple={{ color: `${onPrimary}55` }}
                onPress={() => {
                    router.push("/onboarding/favorites");
                }}
            >
                <Text className="text-on-primary">Continue</Text>
            </Pressable>
        </View>
    )
}