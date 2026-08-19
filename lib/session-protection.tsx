import * as LocalAuthentication from "expo-local-authentication";
import { useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";

export type UnlockResult = { success: boolean; message?: string };

export async function authenticateWorkspace(promptMessage: string): Promise<UnlockResult> {
  if (Platform.OS === "web") return { success: true };
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!hasHardware || !enrolled) return { success: false, message: "No enrolled biometric protection is available on this device." };
  const result = await LocalAuthentication.authenticateAsync({ promptMessage, fallbackLabel: "Use device passcode", disableDeviceFallback: false });
  if (!result.success) return { success: false, message: result.error === "user_cancel" ? "Authentication was cancelled." : (result.warning || "Authentication was not completed.") };
  return { success: true };
}

export function useWorkspaceSessionGate(enabled: boolean, timeoutMs = 60000) {
  const backgroundAt = useRef<number | null>(null);
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    if (!enabled || Platform.OS === "web") { setLocked(false); return; }
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "background" || nextState === "inactive") backgroundAt.current = Date.now();
      if (nextState === "active" && backgroundAt.current) {
        if (Date.now() - backgroundAt.current >= timeoutMs) setLocked(true);
        backgroundAt.current = null;
      }
    });
    return () => subscription.remove();
  }, [enabled, timeoutMs]);
  return { locked, unlock: () => setLocked(false) };
}
