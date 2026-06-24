import "../global.css";

import { useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeQueryClient } from "@skinsavior/core/query";
import { colors } from "@skinsavior/ui";

export default function RootLayout() {
  // Shared QueryClient factory from @skinsavior/core — same defaults as web.
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.cream },
              headerTitleStyle: { color: colors.ink },
              headerTintColor: colors.clay,
              contentStyle: { backgroundColor: colors.cream },
            }}
          >
            <Stack.Screen name="index" options={{ title: "skinsavior" }} />
            <Stack.Screen name="ingredients" options={{ title: "Ingredients" }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
