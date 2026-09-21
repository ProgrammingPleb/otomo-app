import { Host } from "@expo/ui";
import { Switch } from "@expo/ui/jetpack-compose";
import { Platform, View } from "react-native";
import { useCSSVariable } from "uniwind";
import { AppText as Text } from "./text";

interface SettingsSwitchProps {
    title: string;
    description: string;
    value: boolean;
    enabled?: boolean;
    onValueChange: (value: boolean) => void;
}

export function SettingsSwitch({ title, description, value, enabled, onValueChange }: SettingsSwitchProps) {
    const primary = useCSSVariable("--color-primary") as string;
    const onPrimary = useCSSVariable("--color-on-primary") as string;

    return (
        <View className="flex-1 flex-row items-center">
            <View className="flex-1">
                <Text className="text-on-surface" weight="bold">{title}</Text>
                <Text className="text-on-surface -mt-1">{description}</Text>
            </View>
            <Host matchContents>
                {
                    Platform.OS == "android" &&
                    <Switch
                        colors={{
                            checkedTrackColor: primary,
                            checkedThumbColor: onPrimary
                        }}
                        value={value}
                        onCheckedChange={onValueChange}
                        enabled={enabled}
                    />
                }
            </Host>
        </View>
    )
}
