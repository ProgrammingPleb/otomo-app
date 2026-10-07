import { TabletNavProvider, useTabletNav } from "@/components/tablet";
import { AppText as Text } from "@/components/text";
import { TabList, Tabs, TabSlot, TabTrigger } from "expo-router/ui";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { AndroidSymbol, SymbolView } from "expo-symbols";
import { useEffect, useRef } from "react";
import { GestureResponderEvent, Platform, Pressable, PressableProps, useWindowDimensions, View } from "react-native";
import Animated, { useSharedValue, withSpring } from "react-native-reanimated";
import { useCSSVariable } from "uniwind";

export default function TabLayout() {
    const { width } = useWindowDimensions();

    return (
        <>
            {
                width < 600 &&
                <PhoneLayout />
            }
            {
                Platform.OS == "android" && width >= 600 &&
                <TabletNavProvider>
                    <AndroidTabletLayout />
                </TabletNavProvider>
            }
        </>
    )
}

function PhoneLayout() {
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
                <NativeTabs.Trigger.Icon md="more_horiz" />
                <NativeTabs.Trigger.Label>More</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
        </NativeTabs>
    )
}

function AndroidTabletLayout() {
    const { indicatorPosition, indicatorHeight } = useTabletNav();

    return (
        <Tabs className="flex-1 flex-row bg-surface">
            <TabList asChild>
                <View className="relative gap-8 pl-4 py-safe mr-10 justify-center bg-linear-to-r from-surface-container-highest to-transparent"
                    style={{ flexDirection: "column", justifyContent: "center" }}>
                    <Animated.View
                        className="absolute rounded-r-full w-1 h-12 bg-primary top-0"
                        style={[, { transform: [{ translateY: indicatorPosition }], height: indicatorHeight }]}
                    />
                    <TabTrigger name="home" href="/(tabs)" asChild>
                        <NavItem label="Home" symbol="home" />
                    </TabTrigger>
                    <TabTrigger name="favorites" href="/(tabs)/favorites" asChild>
                        <NavItem label="Favorites" symbol="favorite" />
                    </TabTrigger>
                    <TabTrigger name="more" href="/(tabs)/settings" asChild>
                        <NavItem label="More" symbol="more_horiz" />
                    </TabTrigger>
                </View>
            </TabList>
            <TabSlot className="flex-1" />
        </Tabs>
    )
}

interface NavItemProps extends PressableProps {
    label: string;
    symbol: AndroidSymbol;
    isFocused?: boolean;
}

function NavItem({ label, symbol, isFocused, ...props }: NavItemProps) {
    const { handlePageChange } = useTabletNav();
    const element = useRef<View>(null);
    const onSurfaceVariant = useCSSVariable("--color-on-surface-variant") as string;
    const primary = useCSSVariable("--color-primary") as string;
    const itemColor = useSharedValue(isFocused ? primary : onSurfaceVariant);

    function handleTap(event: GestureResponderEvent) {
        if (props.onPress) {
            props.onPress(event);
        }
    }

    function handleLayout() {
        if (element.current && isFocused) {
            element.current.measure((x, y, width, height, pageX, pageY) => {
                handlePageChange(label, height, pageY);
            });
        }
    }

    useEffect(() => {
        itemColor.value = withSpring(isFocused ? primary : onSurfaceVariant);
        if (element.current && isFocused) {
            element.current.measure((x, y, width, height, pageX, pageY) => {
                handlePageChange(label, height, pageY);
            });
        }
    }, [isFocused]);

    return (
        <Pressable onLayout={handleLayout} ref={element} className="items-center" onPress={handleTap}>
            <SymbolView
                name={{ android: symbol }}
                tintColor={isFocused ? primary : onSurfaceVariant}
            />
            <Text className={`${isFocused ? "text-primary" : "text-on-surface-variant"}`}>
                {label}
            </Text>
        </Pressable>
    )
}
