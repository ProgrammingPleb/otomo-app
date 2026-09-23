import { Image } from "@/components/image";
import { AppText as Text } from "@/components/text";
import '@/global.css';
import { db } from "@/utils/db";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useState } from "react";
import { Linking, Pressable, View } from "react-native";
import Animated, { useAnimatedScrollHandler, useSharedValue, withSpring } from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";
import { useCSSVariable } from "uniwind";
import { channelsTable, favoritesTable } from "../../../db/schema";

const SCROLL_THRESHOLD = 4;

export default function FavoritesTab() {
  const router = useRouter();
  const secondary = useCSSVariable("--color-secondary") as string;
  const onTertiary = useCSSVariable("--color-on-tertiary") as string;
  const { data: favoritesData } = useLiveQuery(
    db.select().from(favoritesTable)
      .innerJoin(channelsTable, eq(channelsTable.id, favoritesTable.channel_id))
  );
  const [fabVisible, setFabVisible] = useState(true);
  const fabOpacity = useSharedValue(100);
  const lastScroll = useSharedValue(0);
  const [titleHeight, setTitleHeight] = useState(0);

  const splitGroups = useCallback(() => {
    let data: { [key: string]: typeof favoritesData } = {};

    for (const row of favoritesData) {
      let groupName = row.channels.group_name ?? row.channels.organization;

      if (Object.keys(data).includes(groupName)) {
        data[groupName].push(row);
      } else {
        data[groupName] = [row];
      }
    }

    return Object.entries(data).sort((a, b) => a[0].localeCompare(b[0]));
  }, [favoritesData]);

  const handleScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      "worklet";
      const scroll = event.contentOffset.y;

      if (scroll <= 0) {
        fabOpacity.value = withSpring(100);
        runOnJS(setFabVisible)(true);
        lastScroll.value = scroll;
        return;
      }

      const diff = scroll - lastScroll.value;
      if (Math.abs(diff) > SCROLL_THRESHOLD) {
        const visible = diff < 0;
        fabOpacity.value = withSpring(visible ? 100 : 0);
        runOnJS(setFabVisible)(visible);
        lastScroll.value = scroll;
      }
    }
  });

  return (
    <View className="flex-1 bg-surface pt-safe overflow-hidden">
      <Animated.ScrollView className="flex-1 px-4" onScroll={handleScroll}>
        <View>
          <Text className="text-on-surface text-3xl" weight="bold">Favorites</Text>
          <Text className="text-primary">Show off your oshi list!</Text>
        </View>

        <View className="mt-4 flex-1 gap-6 pb-8">
          {
            splitGroups().map((group) =>
              <View className="relative" key={`Favorited Group - ${group[0]}`}>
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
                  style={{marginTop: titleHeight / 2}}
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
                        <View>
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
        </View>
      </Animated.ScrollView>
      <Animated.View style={{ opacity: fabOpacity }}>
        <Pressable
          className={`absolute flex-1 flex-row items-center gap-2 rounded-md bottom-4 right-4 pl-3 pr-4 py-3 bg-tertiary`}
          pointerEvents={fabVisible ? "auto" : "none"}
          android_ripple={{ color: `${onTertiary}55` }}
          onPress={() => {
            router.push("/add_favorites");
          }}
        >
          <SymbolView
            tintColor={onTertiary}
            name={{
              android: "add"
            }}
          />
          <Text className="text-on-tertiary" weight="semibold">Add</Text>
        </Pressable>
      </Animated.View>
    </View >
  );
}
