import { Image } from "@/components/image";
import { AppText as Text } from "@/components/text";
import { format } from "date-fns";
import { SymbolView } from "expo-symbols";
import { memo, useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { useCSSVariable } from "uniwind";
import { channelsTable, streamsTable } from "../../db/schema";

interface ThumbnailImageProps {
    videoId: string;
}

interface StreamsSelect {
    streams: typeof streamsTable.$inferSelect;
    channels: typeof channelsTable.$inferSelect;
}

export function ThumbnailImage({ videoId }: ThumbnailImageProps) {
    const [thumbnailType, setThumbnailType] = useState("maxresdefault");

    return (
        <Image
            className="flex-1"
            source={`https://img.youtube.com/vi/${videoId}/${thumbnailType}.jpg`}
            contentFit="cover"
            onError={() => setThumbnailType("hqdefault")}    // Fallback to hqdefault (since it's a confirmed quality) on failure
        />
    );
}

interface StreamCardProps {
    video: StreamsSelect;
    isFavorited: boolean;
    scheduled: boolean;
}

export const StreamCard = memo(
    function StreamCard({ video, isFavorited, scheduled }: StreamCardProps) {
        const secondary = useCSSVariable("--color-secondary") as string;
        const tertiary = useCSSVariable("--color-tertiary") as string;

        return (
            <View className="rounded-lg overflow-hidden mt-4">
                <Pressable
                    android_ripple={{ color: `${secondary}55`, foreground: true }}
                    onPress={() => {
                        Linking.openURL(`https://www.youtube.com/watch?v=${video.streams.video_id}`);
                    }}
                >
                    <View className="aspect-video bg-primary">
                        <ThumbnailImage
                            videoId={video.streams.video_id}
                        />
                    </View>
                    <View className="flex flex-row bg-secondary-container px-4 pt-3 pb-4 items-center gap-2">
                        <View className="flex-1 gap-2">
                            <Text numberOfLines={2} className="text-on-secondary-container text-xl" weight="semibold">{video.streams.title}</Text>
                            <View className="flex flex-row items-center gap-2">
                                <View className="flex flex-row rounded-full overflow-hidden w-8 aspect-square">
                                    <Image
                                        className="flex-1"
                                        source={video.channels.profile_picture}
                                        contentFit="cover"
                                    />
                                </View>
                                <View className="flex-row gap-1">
                                    <Text className="text-on-secondary-container" weight="medium">{video.channels.name}</Text>
                                    {
                                        video.channels.romaji &&
                                        <Text className="text-on-secondary-container opacity-60" weight="medium">({video.channels.romaji})</Text>
                                    }
                                </View>
                            </View>
                            <View className="flex-1 grow flex-row">
                                <View className="flex-1 flex-row items-center gap-1.5">
                                    <View className={`${scheduled ? "bg-tertiary" : "bg-error"} rounded-full w-2.5 aspect-square`} />
                                    {
                                        (video.streams.start_scheduled || video.streams.start_actual) &&
                                        <Text className="text-on-secondary-container text-xs opacity-75">
                                            {scheduled ? "On" : "Since"} {
                                                video.streams.start_actual ?
                                                    format(new Date(video.streams.start_actual), "d MMMM, h:mmaaa") :
                                                    format(new Date(video.streams.start_scheduled!), "d MMMM, h:mmaaa")
                                            }
                                        </Text>
                                    }
                                    {
                                        (!video.streams.start_scheduled && !video.streams.start_actual) &&
                                        <Text className="text-on-secondary-container text-xs opacity-75">Stream time unknown</Text>
                                    }
                                </View>
                                {
                                    isFavorited &&
                                    <View className="self-start flex-row items-center gap-1.5">
                                        <SymbolView
                                            tintColor={tertiary}
                                            size={16}
                                            name={{
                                                android: "favorite"
                                            }}
                                        />
                                        <Text className="text-on-secondary-container text-xs opacity-75">Favorited</Text>
                                    </View>
                                }
                            </View>
                        </View>
                    </View>
                </Pressable>
            </View>
        )
    }
);
