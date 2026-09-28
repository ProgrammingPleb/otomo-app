import StreamsScreenshot from "@/assets/images/screenshots/streams.png";
import { Image } from "@/components/image";
import { AppText as Text } from "@/components/text";
import { getSettings, setSettings } from "@/utils/db";
import { Pressable, View } from "react-native";
import { useCSSVariable } from "uniwind";

export default function OnboardingStreamsPage() {
    const onPrimary = useCSSVariable("--color-on-primary") as string;

    return (
        <View className="flex-1 py-safe-offset-2 bg-surface px-4">
            <View className="flex-1 justify-center items-center gap-8">
                <Text className="text-primary text-4xl" weight="bold">Streams</Text>
                <View className="p-2 bg-primary-container rounded-md">
                    <Image
                        source={StreamsScreenshot}
                        className="w-72 rounded-md aspect-1007/1869"
                    />
                </View>
                <View>
                    <Text className="text-center text-on-surface">The home screen will show livestreams from all Nijisanji livers!</Text>
                    <Text className="text-center text-on-surface leading-5 mt-1">
                        Oshis added into the favorites list will be shown at the top of the list.
                    </Text>
                    <Text className="text-center text-on-surface">Enjoy!</Text>
                </View>
            </View>
            <Pressable
                className="rounded-md p-2 bg-primary items-center"
                android_ripple={{ color: `${onPrimary}55` }}
                onPress={async () => {
                    const settings = await getSettings();
                    await setSettings({ ...settings, onboardingDone: true });
                }}
            >
                <Text className="text-on-primary">Start Using</Text>
            </Pressable>
        </View>
    )
}