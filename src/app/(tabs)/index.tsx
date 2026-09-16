import { Image } from "@/components/image";
import { AppText as Text } from "@/components/text";
import '@/global.css';
import { db, refreshStreams } from "@/utils/db";
import { getLatestVideos } from "@/utils/fetch";
import { format } from "date-fns";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useCallback, useState } from "react";
import { Linking, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useCSSVariable } from "uniwind";
import { channelsTable, streamsTable } from "../../../db/schema";

export default function HomeTab() {
  const primary = useCSSVariable("--color-primary") as string;
  const onPrimary = useCSSVariable("--color-on-primary") as string;
  const secondary = useCSSVariable("--color-secondary") as string;
  const { data } = useLiveQuery(db.select().from(streamsTable).leftJoin(channelsTable, eq(streamsTable.channel_id, channelsTable.id)).where(eq(streamsTable.ended, 0)));
  const [refreshing, setRefreshing] = useState(false);

  const refreshStreamsList = useCallback(async () => {
    setRefreshing(true);
    const videos = await getLatestVideos();
    await refreshStreams(videos);
    setRefreshing(false);
  }, []);

  return (
    <View className="flex-1 bg-surface pt-safe">
      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing} onRefresh={refreshStreamsList}
            colors={[onPrimary]}
            progressBackgroundColor={primary}
          />
        }
      >
        <View>
          <Text className="text-on-surface text-3xl" weight="bold">Home</Text>
          <Text className="text-primary">Ongoing Live Streams: {data.length.toString()}</Text>
        </View>
        <View
          className="flex-1 gap-2"
        >
          {
            data.sort((a, b) => a.streams.time - b.streams.time).map((video) => {
              const scheduled = new Date().getTime() < video.streams.time;

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
                      <Image
                        className="flex-1"
                        source={`https://img.youtube.com/vi/${video.streams.video_id}/maxresdefault.jpg`}
                        contentFit="cover"
                      />
                    </View>
                    <View className="flex flex-row bg-secondary-container px-4 pt-3 pb-4 items-center gap-2">
                      <View className="flex-1 gap-2">
                        <Text numberOfLines={2} className="text-on-secondary-container text-xl" weight="semibold">{video.streams.title}</Text>
                        <View className="flex flex-row items-center gap-2">
                          <View className="flex flex-row rounded-full overflow-hidden w-8 aspect-square">
                            <Image
                              className="flex-1"
                              source={video.channels!.profile_picture}
                              contentFit="cover"
                            />
                          </View>
                          <Text numberOfLines={1} className="flex-1 text-on-secondary-container" weight="medium">{video.channels!.name}</Text>
                        </View>
                        <View className="flex flex-row items-center gap-1.5">
                          <View className={`${scheduled ? "bg-tertiary" : "bg-error"} rounded-full w-2.5 aspect-square`} />
                          <Text className="text-on-secondary-container text-xs opacity-75">
                            {scheduled ? "On" : "Since"} {format(new Date(video.streams.time), "d MMMM, h:mmaaa")}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                </View>
              )
            })
          }
        </View>
      </ScrollView>
    </View>
  );
}
