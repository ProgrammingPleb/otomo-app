import { ExperimentalStack as Stack } from "expo-router";
import { SafeAreaListener } from "react-native-safe-area-context";
import { Uniwind } from "uniwind";

export default function RootLayout() {
  return (
      <SafeAreaListener onChange={({ insets }) => {
        Uniwind.updateInsets(insets);
      }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
    </Stack>
      </SafeAreaListener>
  );
}
