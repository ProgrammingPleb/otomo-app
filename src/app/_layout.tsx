import { db, DB_NAME, expo } from "@/utils/db";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { ExperimentalStack as Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { SafeAreaListener } from "react-native-safe-area-context";
import { Uniwind } from "uniwind";
import migrations from "../../drizzle/migrations";

export default function RootLayout() {
  useDrizzleStudio(expo);
  const { success, error } = useMigrations(db, migrations);

  return (
    <SQLiteProvider databaseName={DB_NAME}>
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
