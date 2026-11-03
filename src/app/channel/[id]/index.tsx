import { Image } from "@/components/image";
import { ThumbnailImage } from "@/components/streams";
import { AppText as Text } from "@/components/text";
import { AppChannel } from "@/model/app";
import { BackendChannelRecents, BackendVideo } from "@/model/backend";
import { getChannelData } from "@/utils/db";
import { getChannelRecents } from "@/utils/fetch";
import { Host } from "@expo/ui";
import { ContainedLoadingIndicator } from "@expo/ui/jetpack-compose";
import { format } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import { useCSSVariable } from "uniwind";

export default function ChannelPage() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [channel, setChannel] = useState<AppChannel | null>(null);
    const [recents, setRecents] = useState<BackendChannelRecents | null>(null);

    useEffect(() => {
        if (channel) return;

        getChannelData(id).then(async (channelData) => {
            if (channelData) {
                setChannel(channelData);
                const resp = await getChannelRecents(id);
                if (resp) {
                    setRecents(resp);
                }
            }
        });
    }, [id]);

    return (
        <View className="flex-1 py-safe bg-surface">
            {
                channel &&
                <DetailsLoaded channel={channel} recents={recents} />
            }
        </View>
    )
}

interface DetailsLoadedProps {
    channel: AppChannel;
    recents: BackendChannelRecents | null;
}

function DetailsLoaded({ channel, recents }: DetailsLoadedProps) {
    const { width } = useWindowDimensions();

    return (
        <>
            {
                width < 768 &&
                <ScrollView className="flex-col flex-1" contentContainerClassName="py-2 px-4 gap-4">
                    <ChannelHeader channel={channel} />
                    {
                        !recents &&
                        <RecentsFetching />
                    }
                    {
                        recents &&
                        <RecentsList recents={recents} />
                    }
                </ScrollView>
            }
            {
                width >= 768 &&
                <View className="flex-row flex-1 gap-10 pt-2 px-4">
                    <ChannelHeader channel={channel} />
                    {
                        !recents &&
                        <RecentsFetching />
                    }
                    {
                        recents &&
                        <RecentsList recents={recents} />
                    }
                </View>
            }
        </>

    )
}

interface ChannelHeaderProps {
    channel: AppChannel;
}

function ChannelHeader({ channel }: ChannelHeaderProps) {
    const router = useRouter();
    const onPrimary = useCSSVariable("--color-on-primary") as string;
    const [profilePictureSize, setProfilePictureSize] = useState(0);
    const inversePrimary = useCSSVariable("--color-inverse-primary") as string;

    return (
        <View className="relative lg:flex-2 justify-center gap-4">
            <View className="relative lg:absolute lg:top-0 lg:mt-2 flex-row gap-3">
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
                    <Text className="text-on-surface text-3xl" weight="bold">Profile</Text>
                    <Text className="text-primary">Check their latest uploads here!</Text>
                </View>
            </View>
            <View>
                <View className="relative w-full aspect-16/6">
                    <Image
                        className="flex-1 rounded-md"
                        source={`${channel.banner}=w800`}
                        placeholder={{ thumbhash: channel.banner_hash ?? undefined }}
                        transition={100}
                        contentFit="cover"
                    />
                    <View className="absolute bottom-0 w-1/4 aspect-square rounded-full p-1 bg-surface translate-x-1/8 translate-y-1/2">
                        <Image
                            onLayout={(e) => setProfilePictureSize(e.nativeEvent.layout.height)}
                            className="flex-1 rounded-full"
                            source={channel.profile_picture}
                            placeholder={{ thumbhash: channel.profile_hash ?? undefined }}
                            transition={100}
                            contentFit="cover"
                        />
                    </View>
                </View>
                <View className="justify-center" style={{ minHeight: profilePictureSize / 2 }}>
                    <Pressable
                        className="flex flex-row gap-1 bg-primary px-4 py-2.5 rounded-md self-end"
                        android_ripple={{ color: `${inversePrimary}55` }}
                        onPress={async () => await Linking.openURL(`https://youtube.com/channel/${channel.id}`)}
                    >
                        <Text weight="semibold" className="text-on-primary">Open in YouTube</Text>
                    </Pressable>
                </View>
            </View>
            <View>
                <Text className="text-on-surface text-2xl" weight="bold">{channel.name}</Text>
                {
                    channel.romaji &&
                    <Text className="text-on-surface text-lg opacity-60">{channel.romaji}</Text>
                }
            </View>
            {
                channel.group &&
                <View>
                    <Text className="text-on-surface">Affiliated Groups:</Text>
                    <Text className="text-on-surface -mt-1" weight="semibold">{channel.group}</Text>
                    {
                        channel.major_group &&
                        <Text className="text-on-surface -mt-1" weight="semibold">{channel.major_group}</Text>
                    }
                </View>
            }
        </View>
    )
}

function RecentsFetching() {
    const primary = useCSSVariable("--color-primary") as string;
    const onPrimary = useCSSVariable("--color-on-primary") as string;

    return (
        <View className="flex-1 lg:flex-3 justify-center items-center gap-2">
            <View className="flex-row items-center gap-4">
                <Host matchContents>
                    <ContainedLoadingIndicator
                        color={primary}
                        containerColor={onPrimary}
                    />
                </Host>
                <Text className="text-on-surface text-2xl" weight="bold">Loading Recents</Text>
            </View>
            <Text className="text-primary">Recent videos, streams and shorts are being loaded.</Text>
        </View>
    )
}

interface RecentsListProps {
    recents: BackendChannelRecents;
}

function RecentsList({ recents }: RecentsListProps) {
    const { width } = useWindowDimensions();

    return (
        <View className="flex-1 lg:flex-3">
            {
                width < 768 &&
                <RecentsListContent recents={recents} />
            }
            {
                width >= 768 &&
                <ScrollView>
                    <RecentsListContent recents={recents} />
                </ScrollView>
            }
        </View>
    )
}

function RecentsListContent({ recents }: RecentsListProps) {
    return (
        <View className="gap-4 flex-1">
            <RecentsListRow title="Videos"
                videos={recents.videos.sort((a, b) =>
                    b.published_at - a.published_at)
                }
            />
            <RecentsListRow title="Streams"
                videos={recents.streams.sort((a, b) =>
                    (b.start_scheduled ?? b.published_at) - (a.start_scheduled ?? a.published_at))
                }
            />
            <RecentsListRow title="Shorts"
                videos={recents.shorts.sort((a, b) =>
                    b.published_at - a.published_at)
                }
            />
        </View>
    )
}

interface RecentsListRowProps {
    title: string;
    videos: BackendVideo[];
}

function RecentsListRow({ title, videos }: RecentsListRowProps) {
    return (
        <View className="gap-2">
            <Text className="text-2xl text-on-surface" weight="bold">{title}</Text>
            <ScrollView
                className="h-fit"
                contentContainerClassName="gap-4"
                showsHorizontalScrollIndicator={false}
                horizontal
            >
                {
                    videos.length > 0 && videos.map((video) =>
                        <VideoItem key={`Video - ${video.video_id}`} video={video} isShort={title == "Shorts"} />
                    )
                }
                {
                    videos.length < 1 &&
                    <View className="flex-1">
                        <Text className="text-on-surface">No {title.toLowerCase()}.</Text>
                    </View>
                }
            </ScrollView>
        </View>
    );
}

interface VideoItemProps {
    video: BackendVideo;
    isShort: boolean;
}

function VideoItem({ video, isShort }: VideoItemProps) {
    const currentDate = useMemo(() => new Date(), [video]);
    const videoDate = useMemo(() => video.start_scheduled ?
        new Date(video.start_scheduled) :
        new Date(video.published_at),
        [video]
    );

    return (
        <Pressable
            className={`${isShort ? "w-[35vw] lg:w-[10vw]" : "w-[60vw] lg:w-[20vw]"} gap-2`}
            onPress={async () => await Linking.openURL(`https://youtube.com/watch?v=${video.video_id}`)}
        >
            <View className={`${isShort ? "aspect-9/16" : "aspect-video"} rounded-lg overflow-hidden`}>
                <ThumbnailImage
                    videoId={video.video_id}
                    placeholder={video.thumbhash}
                />
            </View>
            <Text
                className="text-on-surface leading-6 -mb-3"
                numberOfLines={2}
                ellipsizeMode="tail"
                weight="semibold"
            >
                {video.title}
            </Text>
            <Text className="text-on-surface opacity-75">
                {videoDate ? format(videoDate, "d MMMM") : "Unknown Date"}
                {currentDate < videoDate ? " (Upcoming)" : ""}
            </Text>
        </Pressable>
    )
}
