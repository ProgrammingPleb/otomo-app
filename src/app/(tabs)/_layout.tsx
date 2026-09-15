import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useCSSVariable } from "uniwind";

export default function TabLayout() {
    const surfaceContainer = useCSSVariable("--color-surface-container") as string;
    const primary = useCSSVariable("--color-primary") as string;
    const onPrimaryContainer = useCSSVariable("--color-on-primary-container") as string;
    const inversePrimary = useCSSVariable("--color-inverse-primary") as string;

    return (
        <NativeTabs
            backgroundColor={surfaceContainer}
            iconColor={onPrimaryContainer}
            indicatorColor={inversePrimary}
            rippleColor={primary}
        >
            <NativeTabs.Trigger name="index">
                <NativeTabs.Trigger.Icon md="home" />
                <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="favorites">
                <NativeTabs.Trigger.Icon md="favorite" />
                <NativeTabs.Trigger.Label>Favorites</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="settings">
                <NativeTabs.Trigger.Icon md="settings" />
                <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
        </NativeTabs>
    )
}
