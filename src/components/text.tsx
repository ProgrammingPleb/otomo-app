import { Text } from "react-native";

export const TextWeights = {
    thin: "font-otomo-thin",
    light: "font-otomo-light",
    regular: "font-otomo",
    medium: "font-otomo-medium",
    semibold: "font-otomo-semibold",
    bold: "font-otomo-bold",
    extrabold: "font-otomo-extrabold"
}

interface AppTextProps {
    weight?: keyof typeof TextWeights;
    className?: string;
    children: string;
}

export function AppText({ weight = "regular", className, children }: AppTextProps) {
    return (
        <Text className={`${className} ${TextWeights[weight]}`}>{children}</Text>
    )
}