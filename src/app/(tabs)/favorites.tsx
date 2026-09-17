import { Image } from "@/components/image";
import { channelRegex } from "@/components/streamer";
import { AppText as Text } from "@/components/text";
import '@/global.css';
import { db } from "@/utils/db";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, { useAnimatedScrollHandler, useSharedValue, withSpring } from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";
import { useCSSVariable } from "uniwind";
import { channelsTable, favoritesTable } from "../../../db/schema";

const SCROLL_THRESHOLD = 4;

export default function FavoritesTab() {
  const router = useRouter();
  const onTertiary = useCSSVariable("--color-on-tertiary") as string;
  const { data: favoritesData } = useLiveQuery(
    db.select().from(favoritesTable)
      .leftJoin(channelsTable, eq(channelsTable.id, favoritesTable.channel_id))
  );
  const [fabVisible, setFabVisible] = useState(true);
  const fabOpacity = useSharedValue(100);
  const lastScroll = useSharedValue(0);

  const splitGroups = useCallback(() => {
    let data: { [key: string]: typeof favoritesData } = {};

    for (const row of favoritesData) {
      const groupName = row.channels!.group_name!;

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
                  <View className="px-4 bg-surface">
                    <View className="self-start px-4 py-3 rounded-md bg-tertiary-container">
                      <Text className="text-on-tertiary-container text-lg" weight="bold">{group[0]}</Text>
                    </View>
                  </View>
                </View>
                <View className="flex-1 gap-4 mt-7 px-4 pt-8 pb-6 outline outline-outline-variant rounded-md">
                  {
                    group[1].map((row) =>
                      <View key={`${group[0]} Favorite: ${row.channels!.name}`} className="flex-1 flex-row items-center gap-4 bg-secondary-container px-4 py-3 rounded-md">
                        <View className="w-12 aspect-square">
                          <Image
                            className="flex-1 rounded-full"
                            source={row.channels!.profile_picture}
                            contentFit="cover"
                          />
                        </View>
                        <Text className="text-on-secondary-container text-lg" weight="semibold">{row.channels!.name.replace(channelRegex, "")}</Text>
                      </View>
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
