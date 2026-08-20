import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";
import { colors } from "@/components/case-ui";
import { useCaseData } from "@/lib/case-store";
import { authenticateWorkspace, useWorkspaceSessionGate } from "@/lib/session-protection";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);
  const { biometricGateEnabled } = useCaseData();
  const { locked, unlock } = useWorkspaceSessionGate(biometricGateEnabled);

  // Initialize Manus runtime for cookie injection from parent container
  useEffect(() => {
    initManusRuntime();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  // Create clients once and reuse them
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Disable automatic refetching on window focus for mobile
            refetchOnWindowFocus: false,
            // Retry failed requests once
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  // Ensure minimum 8px padding for top and bottom on mobile
  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {/* Default to hiding native headers so raw route segments don't appear (e.g. "(tabs)", "products/[id]"). */}
          {/* If a screen needs the native header, explicitly enable it and set a human title via Stack.Screen options. */}
          {/* in order for ios apps tab switching to work properly, use presentation: "fullScreenModal" for login page, whenever you decide to use presentation: "modal*/}
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="oauth/callback" />
          </Stack>
          <StatusBar style="auto" />
          {locked ? <SessionLock onUnlock={unlock} /> : null}
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );

  const shouldOverrideSafeArea = Platform.OS === "web";

  if (shouldOverrideSafeArea) {
    return (
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>
              {content}
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
    </ThemeProvider>
  );
}

function SessionLock({ onUnlock }: { onUnlock: () => void }) {
  const [message, setMessage] = useState("Your workspace was protected after backgrounding.");
  async function unlock() { const result = await authenticateWorkspace("Unlock Pro Se Compass workspace"); if (result.success) onUnlock(); else setMessage(result.message || "Authentication was not completed."); }
  return <View style={lockStyles.overlay}><View style={lockStyles.card}><View style={lockStyles.icon}><Text style={lockStyles.iconText}>⌁</Text></View><Text style={lockStyles.title}>Workspace locked</Text><Text style={lockStyles.body}>{message}</Text><TouchableOpacity onPress={unlock} style={lockStyles.button}><Text style={lockStyles.buttonText}>Unlock with device authentication</Text></TouchableOpacity><Text style={lockStyles.note}>If biometric settings changed, use your device passcode when offered. This session gate does not replace encrypted data storage.</Text></View></View>;
}

const lockStyles = StyleSheet.create({ overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(22,50,79,0.94)", zIndex: 999, alignItems: "center", justifyContent: "center", padding: 24 }, card: { backgroundColor: colors.paper, borderRadius: 22, padding: 23, width: "100%", maxWidth: 420, alignItems: "center", gap: 12 }, icon: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" }, iconText: { color: colors.white, fontSize: 28, fontWeight: "800" }, title: { color: colors.charcoal, fontSize: 21, fontWeight: "800" }, body: { color: colors.slate, fontSize: 13, lineHeight: 19, textAlign: "center" }, button: { backgroundColor: colors.navy, minHeight: 48, borderRadius: 14, alignSelf: "stretch", alignItems: "center", justifyContent: "center", paddingHorizontal: 12 }, buttonText: { color: colors.white, fontSize: 13, fontWeight: "800", textAlign: "center" }, note: { color: colors.slate, fontSize: 10, lineHeight: 15, textAlign: "center" } });
