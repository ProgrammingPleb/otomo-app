import { Image } from "@/components/image";
import { AppText as Text } from "@/components/text";
import { Checkbox, Host } from "@expo/ui";
import { memo, useState } from "react";
import { View } from "react-native";
import { channelsTable } from "../../db/schema";

interface StreamerSelectProps {
    height: number;
    channel: typeof channelsTable.$inferSelect;
    enabled: boolean;
    onLayout: (height: number) => void;
    onChange: (channelId: number, enabled: boolean) => void;
}

export const StreamerSelect = memo(function StreamerSelect(
    { height, channel, enabled, onLayout, onChange }: StreamerSelectProps
) {
    const [imageError, setImageError] = useState(false);

    return (
        <View
            className="rounded-md flex-1 flex-row items-center bg-secondary-container p-2 gap-4"
            style={{ height: height != 0 ? height : undefined }}
            onLayout={(event) => {
                if (channel.romaji && channel.group_name) {
                    onLayout(event.nativeEvent.layout.height);
                }
            }}
        >
            <View className="ml-1 w-16 aspect-square">
                {
                    !imageError &&
                    <Image
                        className="flex-1 rounded-full"
                        source={channel.profile_picture}
                        contentFit="cover"
                        onError={(e) => {
                            console.log(e.error)
                            setImageError(true);
                        }}
                        onLoad={() => setImageError(false)}
                    />
                }
                {
                    imageError &&
                    <View className="w-16 aspect-square rounded-full bg-on-secondary-container" />
                }
            </View>
            <View className="flex-1 shrink">
                <View>
                    <Text numberOfLines={2} className="text-on-secondary-container text-lg" weight="bold">{channel.name}</Text>
                    {
                        channel.romaji &&
                        <Text numberOfLines={2} className="text-on-secondary-container opacity-60 -my-1">{channel.romaji}</Text>
                    }
                </View>
                {
                    channel.group_name &&
                    <View className="flex-row gap-1">
                        <Text numberOfLines={2} className="text-on-secondary-container" weight="medium">
                            {channel.is_group_channel ? "Group Channel" : channel.group_name}
                        </Text>
                        {
                            channel.major_group &&
                            <Text numberOfLines={2} className="text-on-secondary-container opacity-60">
                                ({channel.major_group})
                            </Text>
                        }
                    </View>
                }
            </View>
            <Host matchContents>
                <Checkbox value={enabled} onValueChange={(value) => onChange(channel.id, value)} />
            </Host>
        </View>
    )
})
