import { AppTextInput as TextInput } from "@/components/input";
import { StreamerSelect } from "@/components/streamer";
import { AppText as Text } from "@/components/text";
import { db, updateFavorites } from "@/utils/db";
import { FlashList, FlashListRef } from "@shopify/flash-list";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { useCSSVariable } from "uniwind";
import { channelsTable, favoritesTable } from "../../db/schema";

export default function AddFavoritesPage() {
    const router = useRouter();
    const onPrimary = useCSSVariable("--color-on-primary") as string;
    const [searchTerm, setSearchTerm] = useState("");
    const searchTimeout = useRef<number>(null);
    const listRef = useRef<FlashListRef<typeof channelsData[number]>>(null);
    const { data: favoritesData } = useLiveQuery(db.select().from(favoritesTable));
    const { data: channelsData } = useLiveQuery(db.select().from(channelsTable).where(eq(channelsTable.inactive, 0)));
    const favoritedChannels = useMemo(() => new Set(
        favoritesData.map((channel) => channel.channel_id)
    ), [favoritesData]);
    const channelsSorted = useMemo(() => channelsData
        .sort((a, b) =>
            (favoritedChannels.has(b.id) ? 1 : 0) - (favoritedChannels.has(a.id) ? 1 : 0) ||
            (a.group_name ?? "").localeCompare(b.group_name ?? "") ||
        a.name.localeCompare(b.name)
        )
        .filter((row) =>
            searchTerm != "" ?
                row.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                row.romaji != null ? row.romaji!.toLowerCase().includes(searchTerm.toLowerCase()) : false || 
                row.group_name!.toLowerCase().includes(searchTerm.toLowerCase()) :
                true
        )
        , [favoritesData, searchTerm]);

    const handleFavorite = useCallback((channelId: number, enabled: boolean) => {
        updateFavorites(channelId, enabled ? "add" : "remove");
    }, []);

    const handleSearch = useCallback((input: string) => {
        if (searchTimeout.current != null) {
            clearTimeout(searchTimeout.current);
        }
        searchTimeout.current = setTimeout(() => {
            setSearchTerm(input);
            searchTimeout.current = null;
        }, 500);
    }, []);

    useEffect(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, [searchTerm]);

    return (
        <View className="flex-1 bg-surface pt-safe pb-safe overflow-hidden">
            <FlashList
                ref={listRef}
                maintainVisibleContentPosition={{ disabled: true }}
                contentContainerClassName="px-4 pb-4"
                ListHeaderComponent={
                    <View className="flex-1 mb-4">
                        <View className="flex-1 flex-row items-center gap-4">
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
                        <TextInput title="Search" titleClassName="text-on-surface"
                            placeholder="Search for a streamer/group here"
                            onChangeText={handleSearch}
                        />
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
