import { StreamerSelect } from "@/components/streamer";
import { AppText as Text } from "@/components/text";
import { db, updateFavorites } from "@/utils/db";
import { FlashList } from "@shopify/flash-list";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useMemo } from "react";
import { Pressable, View } from "react-native";
import { useCSSVariable } from "uniwind";
import { channelsTable, favoritesTable } from "../../db/schema";

export default function AddFavoritesPage() {
    const router = useRouter();
    const onPrimary = useCSSVariable("--color-on-primary") as string;
    const { data: favoritesData } = useLiveQuery(db.select().from(favoritesTable));
    const { data: channelsData } = useLiveQuery(db.select().from(channelsTable).where(eq(channelsTable.inactive, 0)));
    const channelsSorted = useMemo(() => channelsData
    .sort((a, b) => (a.group_name ?? "").localeCompare(b.group_name ?? "") || a.name.localeCompare(b.name))
    , [favoritesData]);
    const favoritedChannels = useMemo(() => new Set(
        favoritesData.map((channel) => channel.channel_id)
    ), [favoritesData]);

    const handleFavorite = useCallback((channelId: number, enabled: boolean) => {
        updateFavorites(channelId, enabled ? "add" : "remove");
    }, []);

    return (
        <View className="flex-1 bg-surface pt-safe pb-safe overflow-hidden">
            <FlashList
                contentContainerClassName="px-4 pb-4"
                ListHeaderComponent={
                    <View className="flex-1 flex-row items-center gap-4 mb-4">
                        <Pressable
                            className="rounded-md p-2 bg-primary"
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
                            <Text className="text-on-surface text-3xl" weight="bold">Add Channels</Text>
                            <Text className="text-primary">Modify your channels list here.</Text>
                        </View>
                    </View>
                }
                ItemSeparatorComponent={() =>
                    <View className="h-4" />
                }
                data={channelsSorted}
                renderItem={({ item }) =>
                    <StreamerSelect
                        channel={item}
                        enabled={favoritedChannels.has(item.id)}
                        onChange={handleFavorite}
                    />
                }
                keyExtractor={(channel) => channel.youtube_id}
            />
        </View>
    )
}
