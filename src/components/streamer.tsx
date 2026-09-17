import { Image } from "@/components/image";
import { AppText as Text } from "@/components/text";
import { Checkbox, Host } from "@expo/ui";
import { memo, useState } from "react";
import { View } from "react-native";
import { channelsTable } from "../../db/schema";

interface StreamerSelectProps {
    channel: typeof channelsTable.$inferSelect;
    enabled: boolean;
    onChange: (channelId: number, enabled: boolean) => void;
}

export const channelRegex: RegExp = /\s*[\[【].*[】\]]\s*/;

export const StreamerSelect = memo(function StreamerSelect({ channel, enabled, onChange }: StreamerSelectProps) {
    const [imageError, setImageError] = useState(false);

    return (
        <View className="rounded-md flex-1 flex-row items-center bg-secondary-container p-2 gap-4">
            <View className="w-16 aspect-square">
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
                <Text numberOfLines={2} className="text-on-secondary-container text-lg" weight="bold">{channel.name.replace(channelRegex, "")}</Text>
                <Text numberOfLines={2} className="text-on-secondary-container" weight="medium">{channel.group_name}</Text>
            </View>
            <Host matchContents>
                <Checkbox value={enabled} onValueChange={(value) => onChange(channel.id, value)} />
            </Host>
        </View>
    )
})
