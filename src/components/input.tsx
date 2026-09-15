import { TextInput, TextInputProps, View } from "react-native";
import { AppText as Text, TextWeights } from "./text";

interface AppTextInputProps extends TextInputProps {
    title: string;
    titleClassName?: string;
    titleWeight?: keyof typeof TextWeights;
    className?: string;
    weight?: keyof typeof TextWeights;
    hint?: string;
}

export function AppTextInput(
    { title, titleClassName, titleWeight = "medium", className, weight = "regular", hint, ...props }: AppTextInputProps
) {
    return (
        <View>
            <Text className={titleClassName} weight={titleWeight}>{title}</Text>
            <View className="outline outline-outline px-2 mt-0.5 rounded-md">
                <TextInput
                    className={`${className} ${TextWeights[weight]}`}
                    {...props}
                />
            </View>
            {
                hint &&
                <Text weight="light" className="text-outline text-xs mt-1">{hint}</Text>
            }
        </View>
    );
}