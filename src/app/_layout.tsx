import { DB_NAME, initDB } from "@/utils/db";
import { ExperimentalStack as Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { SafeAreaListener } from "react-native-safe-area-context";
import { Uniwind } from "uniwind";


export default function RootLayout() {
  return (
    <SQLiteProvider databaseName={DB_NAME} onInit={async () => await initDB()}>
      <SafeAreaListener onChange={({ insets }) => {
        Uniwind.updateInsets(insets);
      }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </SafeAreaListener>
    </SQLiteProvider>
  );
}
