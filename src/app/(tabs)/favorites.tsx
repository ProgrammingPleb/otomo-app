import { FavoritedGroup } from "@/components/favorites";
import { AppText as Text } from "@/components/text";
import '@/global.css';
import { db } from "@/utils/db";
import { count, eq, isNotNull } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useMemo, useState } from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import Animated, { useAnimatedScrollHandler, useSharedValue, withSpring } from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";
import { useCSSVariable } from "uniwind";
import { channelsTable, favoritesTable } from "../../../db/schema";

const SCROLL_THRESHOLD = 4;

export default function FavoritesTab() {
  const window = useWindowDimensions();
  const router = useRouter();
  const onTertiary = useCSSVariable("--color-on-tertiary") as string;
  const { data: favoritesData } = useLiveQuery(
    db.select().from(favoritesTable)
      .innerJoin(channelsTable, eq(channelsTable.id, favoritesTable.channel_id))
  );
  const { data: majorGroupData } = useLiveQuery(
    db.select({
      majorGroup: channelsTable.major_group,
      totalMembers: count()
    }).from(channelsTable).where(isNotNull(channelsTable.major_group))
      .groupBy(channelsTable.major_group)
  );
  const [fabVisible, setFabVisible] = useState(true);
  const fabOpacity = useSharedValue(100);
  const lastScroll = useSharedValue(0);
  const [titleHeight, setTitleHeight] = useState(0);

  const groupedFavorites = useMemo(() => {
    const validMajorGroups = getValidMajorGroups(favoritesData, majorGroupData);
    const data: Map<string, typeof favoritesData> = new Map();
    const sortedFavorites = [...favoritesData].sort((a, b) =>
      (a.channels.group_name ?? "").localeCompare(b.channels.group_name ?? "") ||
      a.channels.name.localeCompare(b.channels.name)
    );

    for (const row of sortedFavorites) {
      let groupName = row.channels.group_name ?? row.channels.organization;

      if (row.channels.major_group && validMajorGroups.has(row.channels.major_group)) {
        groupName = row.channels.major_group;
      }

      if (data.has(groupName)) {
        data.get(groupName)!.push(row);
      } else {
        data.set(groupName, [row]);
      }
    }

    return Array.from(data).sort((a, b) => a[0].localeCompare(b[0]));
  }, [favoritesData, majorGroupData]);
  const splitGroupFavorites = useMemo(() => {
    const split: typeof groupedFavorites[] = [[], []];
    let left = 0;
    let right = 0;

    for (const group of groupedFavorites) {
      const isOnRight = left > right;
      split[isOnRight ? 1 : 0].push(group);
      
      if (isOnRight) {
        right = right + group[1].length;
      } else {
        left = left + group[1].length;
      }
    }

    return split;
  }, [groupedFavorites]);

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

        {
          window.width < 600 &&
          <View className="mt-4 flex-1 gap-6 pb-8">
            {
              groupedFavorites.map((group) =>
                <FavoritedGroup key={`Favorited Group - ${group[0]}`} group={group} titleHeight={titleHeight} setTitleHeight={setTitleHeight} />
              )
            }
          </View>
        }
        {
          window.width >= 600 &&
          <View className="flex-row gap-8 mt-4 pb-8">
            <View className="flex-1 gap-6">
              {
                splitGroupFavorites[0].map((group) =>
                  <FavoritedGroup key={`Favorited Group - ${group[0]}`} group={group} titleHeight={titleHeight} setTitleHeight={setTitleHeight} />
                )
              }
            </View>
            <View className="flex-1 gap-6">
              {
                splitGroupFavorites[1].map((group) =>
                  <FavoritedGroup key={`Favorited Group - ${group[0]}`} group={group} titleHeight={titleHeight} setTitleHeight={setTitleHeight} />
                )
              }
            </View>
          </View>
        }
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

function getValidMajorGroups(
  favoritedChannels: { channels: { major_group: string | null } }[],
  groupData: { majorGroup: string | null, totalMembers: number }[]
) {
  const validGroups: Set<string> = new Set();
  const groupMap = new Map<string, number>();

  for (const row of favoritedChannels) {
    const majorGroup = row.channels.major_group;
    if (!majorGroup) {
      continue;
    }

    const count = groupMap.get(majorGroup);
    groupMap.set(majorGroup, (count ?? 0) + 1);
  }

  for (const group of groupData) {
    if (group.majorGroup && groupMap.get(group.majorGroup) === group.totalMembers) {
      validGroups.add(group.majorGroup);
    }
  }

  return validGroups;
}
