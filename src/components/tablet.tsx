import { createContext, ReactNode, useContext, useRef } from "react";
import { SharedValue, useSharedValue, withSpring } from "react-native-reanimated";

interface TabletNavProps {
    indicatorPosition: SharedValue<number>;
    indicatorHeight: SharedValue<number>;
    handlePageChange: (page: string, height: number, y: number) => void;
}

const TabletNavContext = createContext<TabletNavProps | null>(null);

export function TabletNavProvider({ children }: { children: ReactNode }) {
    const init = useRef(false);
    const indicatorPosition = useSharedValue(0);
    const indicatorHeight = useSharedValue(0);

    function handlePageChange(item: string, height: number, y: number) {
        const newHeight = height + 8;
        const newY = y + height / 2 - newHeight / 2 - 2;

        if (!init.current) {
            indicatorPosition.value = newY;
            indicatorHeight.value = newHeight;
            init.current = true;
        } else {
            indicatorPosition.value = withSpring(newY, { duration: 100 });
            indicatorHeight.value = withSpring(newHeight, { duration: 100 });
        }
    }

    const values: TabletNavProps = {
        indicatorPosition,
        indicatorHeight,
        handlePageChange,
    }

    return (
        <TabletNavContext value={values}>
            {children}
        </TabletNavContext>
    )
}

export function useTabletNav() {
    const context = useContext(TabletNavContext);

    if (!context) {
        throw new Error("useTabletNav must be used within a TabletNavProvider!");
    }

    return context;
}
