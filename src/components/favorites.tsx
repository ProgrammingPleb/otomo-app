import { Image } from "@/components/image";
import { AppText as Text } from "@/components/text";
import { Linking, Pressable, View } from "react-native";
import { useCSSVariable } from "uniwind";

interface FavoritedGroupProps {
    group: [
        string,
        ChannelDetails[]
    ];
    titleHeight: number;
    setTitleHeight: (value: number) => void;
}

interface ChannelDetails {
    channels: {
        name: string;
        romaji: string | null;
        youtube_id: string;
        profile_picture: string;
        profile_hash: string | null;
    };
}

export function FavoritedGroup({ group, titleHeight, setTitleHeight }: FavoritedGroupProps) {
    const secondary = useCSSVariable("--color-secondary") as string;

    return (
        <View className="relative">
            <View className="left-1/2 -translate-x-1/2 absolute z-10">
                <View className="px-4 bg-surface" onLayout={(event) => {
                    if (titleHeight === 0) {
                        setTitleHeight(event.nativeEvent.layout.height);
                    }
                }}>
                    <View className="self-start px-4 py-3 rounded-md bg-tertiary-container">
                        <Text className="text-on-tertiary-container text-lg" weight="bold">{group[0]}</Text>
                    </View>
                </View>
            </View>
            <View className="flex-1 gap-4 px-4 pt-9 pb-6 outline outline-outline-variant rounded-md"
                style={{ marginTop: titleHeight / 2 }}
            >
                {
                    group[1].map((row) =>
                        <Pressable key={`${group[0]} Favorite: ${row.channels.name}`}
                            className="flex-1 flex-row items-center gap-4 bg-secondary-container px-4 py-3 rounded-md"
                            android_ripple={{ color: `${secondary}55` }}
                            onPress={async () => await Linking.openURL(`https://www.youtube.com/channel/${row.channels.youtube_id}`)}
                        >
                            <View className="w-12 aspect-square">
                                <Image
                                    className="flex-1 rounded-full"
                                    source={row.channels.profile_picture}
                                    contentFit="cover"
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-on-secondary-container text-lg" weight="semibold">{row.channels.name}</Text>
                                {
                                    row.channels.romaji &&
                                    <Text className="-mt-1 opacity-60 text-on-secondary-container">{row.channels.romaji}</Text>
                                }
                            </View>
                        </Pressable>
                    )
                }
            </View>
        </View>
    )
}