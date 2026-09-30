import { StreamCard } from "@/components/streams";
import { AppText as Text } from "@/components/text";
import { activeStreamsFilter, db, refreshChannels, refreshStreams } from "@/utils/db";
import { getLatestChannels, getLatestVideos } from "@/utils/fetch";
import { FlashList } from "@shopify/flash-list";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, View } from "react-native";
import { useCSSVariable } from "uniwind";
import { favoritesTable } from "../../../db/schema";

export default function HomeTab() {
  const primary = useCSSVariable("--color-primary") as string;
  const onPrimary = useCSSVariable("--color-on-primary") as string;
  const { data: streamsData } = useLiveQuery(activeStreamsFilter());
  const { data: favoritesData } = useLiveQuery(db.select().from(favoritesTable));
  const favoritedChannels = useMemo(() => new Set(favoritesData.map((row) => row.channel_id)), [favoritesData]);
  const sortedStreams = useMemo(() =>
    [...streamsData].sort((a, b) =>
      (favoritedChannels.has(b.streams.channel_id) ? 1 : 0) - (favoritedChannels.has(a.streams.channel_id) ? 1 : 0) ||
      (a.streams.start_scheduled ?? 0) - (b.streams.start_scheduled ?? 0)
    ), [streamsData, favoritedChannels]);
  const [now, setNow] = useState(Date.now());
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
    const timeRefresh = setInterval(() => setNow(Date.now()), 60 * 1000);
    refreshStreamsList(false);

    return () => clearInterval(timeRefresh);
  }, []);

  return (
    <View className="flex-1 bg-surface pt-safe overflow-hidden">
      <FlashList
        data={sortedStreams}
        contentContainerClassName="px-4 pb-4"
        renderItem={({ item: video }) =>
          <StreamCard
            video={video}
            isFavorited={favoritedChannels.has(video.channels.id)}
            scheduled={now < (video.streams.start_scheduled ?? 0)}
          />
        }
        keyExtractor={(item) => item.streams.video_id}
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
