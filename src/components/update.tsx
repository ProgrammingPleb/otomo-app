import { AndroidSymbol, SymbolView } from "expo-symbols";
import { reloadAsync, useUpdates } from "expo-updates";
import { Pressable, View } from "react-native";
import { useCSSVariable } from "uniwind";
import { AppText as Text } from "./text";

export function UpdateBox() {
    const update = useUpdates();
    const onSecondary = useCSSVariable("--color-on-secondary") as string;
    const onPrimaryContainer = useCSSVariable("--color-on-primary-container") as string;

    function getUpdateText() {
        if (update.isChecking) {
            return "Checking for Updates.";
        }
        if (update.isDownloading) {
            return "Downloading Update.";
        }
        if (update.isUpdatePending) {
            return "Update Available!";
        }
        return "All Good!";
    }

    function getUpdateDescription() {
        if (update.isChecking) {
            return "Update information is currently being fetched from the server.";
        }
        if (update.isDownloading) {
            return "A new update has been found and is currently being downloaded.";
        }
        if (update.isUpdatePending) {
            return "The latest update has been downloaded and is awaiting an app restart.";
        }
        return "You are currently on the latest version.";
    }

    function getUpdateLogo(): AndroidSymbol {
        if (update.isChecking) {
            return "schedule";
        }
        if (update.isDownloading) {
            return "download";
        }
        if (update.isUpdatePending) {
            return "update";
        }
        return "check_circle";
    }

    return (
        <View className="flex-1 flex-row gap-4 items-center bg-primary-container px-4 py-3 rounded-md">
            <SymbolView
                tintColor={onPrimaryContainer}
                name={{
                    android: getUpdateLogo()
                }}
            />
            <View className="flex-1">
                <Text className="text-on-primary-container" weight="bold">{getUpdateText()}</Text>
                <Text className="text-on-primary-container leading-5 mb-1">{getUpdateDescription()}</Text>
                {
                    update.isUpdatePending &&
                    <Pressable
                        className="rounded-md p-2 bg-secondary self-start flex-row items-center gap-2 mt-1"
                        android_ripple={{ color: `${onSecondary}55` }}
                        onPress={() => reloadAsync()}
                    >
                        <SymbolView
                            tintColor={onSecondary}
                            name={{
                                android: "refresh"
                            }}
                        />
                        <Text className="text-on-secondary mr-1" weight="medium">
                            Restart App
                        </Text>
                    </Pressable>
                }
            </View>
        </View>
    )
}
