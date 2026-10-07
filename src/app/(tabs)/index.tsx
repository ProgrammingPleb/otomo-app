import { StreamCard } from "@/components/streams";
import { AppText as Text } from "@/components/text";
import { activeStreamsFilter, db, refreshChannels, refreshStreams } from "@/utils/db";
import { getLatestChannels, getLatestVideos } from "@/utils/fetch";
import SegmentedControl from '@expo/ui/community/segmented-control';
import { FlashList } from "@shopify/flash-list";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, useWindowDimensions, View } from "react-native";
import { useCSSVariable } from "uniwind";
import { favoritesTable } from "../../../db/schema";

export default function HomeTab() {
  const window = useWindowDimensions();
  const [now, setNow] = useState(Date.now());
  const primary = useCSSVariable("--color-primary") as string;
  const onPrimary = useCSSVariable("--color-on-primary") as string;
  const primaryContainer = useCSSVariable("--color-primary-container") as string;
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { data: streamsData } = useLiveQuery(activeStreamsFilter(now));
  const { data: favoritesData } = useLiveQuery(db.select().from(favoritesTable));
  const favoritedChannels = useMemo(() => new Set(favoritesData.map((row) => row.channel_id)), [favoritesData]);
  const sortedStreams = useMemo(() =>
    [...streamsData].sort((a, b) =>
      (favoritedChannels.has(b.streams.channel_id) ? 1 : 0) - (favoritedChannels.has(a.streams.channel_id) ? 1 : 0) ||
      (a.streams.start_scheduled ?? 0) - (b.streams.start_scheduled ?? 0)
    ), [streamsData, favoritedChannels]);
  const liveStreams = useMemo(() => sortedStreams.filter((video) => video.streams.start_actual), [sortedStreams]);
  const scheduledStreams = useMemo(() => sortedStreams.filter((video) => !video.streams.start_actual), [sortedStreams]);

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
        masonry
        numColumns={window.width < 600 ? 1 : 3}
        data={selectedIndex == 0 ? liveStreams : scheduledStreams}
        contentContainerClassName="px-4 pb-4"
        renderItem={({ item: video }) =>
          <StreamCard
            video={video}
            isFavorited={favoritedChannels.has(video.channels.id)}
            scheduled={video.streams.start_actual == null}
            isTabletMode={window.width >= 600}
          />
        }
        keyExtractor={(item) => item.streams.video_id}
        ListHeaderComponent={
          <View>
            <Text className="text-on-surface text-3xl" weight="bold">Home</Text>
            <Text className="text-primary mb-2">
              {
                "Live Streams: " +
                `${liveStreams.length.toString()} live, ` +
                `${scheduledStreams.length.toString()} upcoming`
              }
            </Text>
            <SegmentedControl
              values={["Live", "Scheduled"]}
              tintColor={`${primaryContainer}AA`}
              selectedIndex={selectedIndex}
              onChange={(event) => setSelectedIndex(event.nativeEvent.selectedSegmentIndex)}
            />
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
