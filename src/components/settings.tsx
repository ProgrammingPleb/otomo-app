import { Host, Switch } from "@expo/ui";
import { View } from "react-native";
import { AppText as Text } from "./text";

interface SettingsSwitchProps {
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
}

export function SettingsSwitch({ title, description, value, onValueChange }: SettingsSwitchProps) {
    return (
        <View className="flex-1 flex-row items-center">
            <View className="flex-1">
                <Text className="text-on-surface" weight="bold">{title}</Text>
                <Text className="text-on-surface">{description}</Text>
            </View>
            <Host matchContents>
                <Switch value={value} onValueChange={onValueChange} />
            </Host>
        </View>
    )
}
