import { Image } from "@/components/image";
import { ThumbnailImage } from "@/components/streams";
import { AppText as Text } from "@/components/text";
import { activeStreamsFilter, db, refreshChannels, refreshStreams } from "@/utils/db";
import { getLatestChannels, getLatestVideos } from "@/utils/fetch";
import { format } from "date-fns";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Linking, Pressable, RefreshControl, View } from "react-native";
import { useCSSVariable } from "uniwind";
import { favoritesTable } from "../../../db/schema";

export default function HomeTab() {
  const primary = useCSSVariable("--color-primary") as string;
  const onPrimary = useCSSVariable("--color-on-primary") as string;
  const secondary = useCSSVariable("--color-secondary") as string;
  const tertiary = useCSSVariable("--color-tertiary") as string;
  const { data: streamsData } = useLiveQuery(activeStreamsFilter());
  const { data: favoritesData } = useLiveQuery(db.select().from(favoritesTable));
  const favoritedChannels = useMemo(() => new Set(favoritesData.map((row) => row.channel_id)), [favoritesData]);
  const sortedStreams = useMemo(() =>
    streamsData.sort((a, b) =>
      (favoritedChannels.has(b.streams.channel_id) ? 1 : 0) - (favoritedChannels.has(a.streams.channel_id) ? 1 : 0) ||
      (a.streams.start_scheduled ?? 0) - (b.streams.start_scheduled ?? 0)
    ), [streamsData, favoritedChannels]);
  const [refreshing, setRefreshing] = useState(false);

  const refreshStreamsList = useCallback(async (showRefreshing: boolean) => {
    if (showRefreshing) {
      setRefreshing(true);
    }
    const channels = await getLatestChannels();
    if (channels) {
      await refreshChannels(channels);
    }
    const videos = await getLatestVideos();
    if (videos) {
      await refreshStreams(videos);
    }
    if (showRefreshing) {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshStreamsList(false);
  }, []);

  return (
    <View className="flex-1 bg-surface pt-safe overflow-hidden">
      <FlatList
        data={sortedStreams}
        contentContainerClassName="px-4 pb-4"
        renderItem={({ item: video }) => {
          const scheduled = new Date().getTime() < (video.streams.start_scheduled ?? 0);

          return (
            <View
              key={`Video Stream - ${video.streams.video_id}`}
              className="rounded-lg overflow-hidden mt-4"
            >
              <Pressable
                android_ripple={{ color: `${secondary}55`, foreground: true }}
                onPress={async () => {
                  await Linking.openURL(`https://www.youtube.com/watch?v=${video.streams.video_id}`);
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
                        favoritedChannels.has(video.streams.channel_id) &&
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
        }}
        ListHeaderComponent={
          <View>
            <Text className="text-on-surface text-3xl" weight="bold">Home</Text>
            <Text className="text-primary">
              {
                "Live Streams: " +
                `${streamsData.filter(({ streams }) => streams.start_actual ? streams.start_actual < new Date().getTime() : false).length.toString()} live, ` +
                `${streamsData.filter(({ streams }) => streams.start_scheduled ? streams.start_scheduled > new Date().getTime() : false).length.toString()} upcoming`
              }
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing} onRefresh={() => refreshStreamsList(true)}
            colors={[onPrimary]}
            progressBackgroundColor={primary}
          />
        }
      />
    </View>
  );
}
