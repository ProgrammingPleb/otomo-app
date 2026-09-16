import { ReactNode } from "react";
import { Text, TextProps } from "react-native";

export const TextWeights = {
    thin: "font-otomo-thin",
    light: "font-otomo-light",
    regular: "font-otomo",
    medium: "font-otomo-medium",
    semibold: "font-otomo-semibold",
    bold: "font-otomo-bold",
    extrabold: "font-otomo-extrabold"
}

interface AppTextProps extends TextProps {
    weight?: keyof typeof TextWeights;
    className?: string;
    children?: ReactNode;
}

export function AppText({ weight = "regular", className, children, ...props }: AppTextProps) {
    return (
        <Text className={`${className} ${TextWeights[weight]}`} {...props}>{children}</Text>
    )
}