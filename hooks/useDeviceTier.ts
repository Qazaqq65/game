import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import React from "react";

export type PerformanceMode = "auto" | "high" | "low";

const PERF_MODE_KEY = "kzv3:perf-mode";

interface DeviceSignals {
  reducedMotion: boolean;
  hardwareConcurrencyLow: boolean;
  deviceMemoryLow: boolean;
  saveDataEnabled: boolean;
}

export interface UseDeviceTierResult {
  mode: PerformanceMode;
  setMode: (next: PerformanceMode) => void;
  isLowEnd: boolean;
  signals: DeviceSignals;
}

function readStoredMode(): PerformanceMode {
  if (typeof window === "undefined") return "auto";
  const raw = window.localStorage.getItem(PERF_MODE_KEY);
  if (raw === "auto" || raw === "high" || raw === "low") return raw;
  return "auto";
}

function readSignals(): DeviceSignals {
  if (typeof window === "undefined") {
    return {
      reducedMotion: false,
      hardwareConcurrencyLow: false,
      deviceMemoryLow: false,
      saveDataEnabled: false,
    };
  }

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const hardwareConcurrencyLow = (navigator.hardwareConcurrency ?? 8) <= 4;
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  const deviceMemoryLow = (nav.deviceMemory ?? 8) <= 3;
  const saveDataEnabled = nav.connection?.saveData === true;

  return {
    reducedMotion,
    hardwareConcurrencyLow,
    deviceMemoryLow,
    saveDataEnabled,
  };
}

function autoLowFromSignals(signals: DeviceSignals): boolean {
  if (signals.reducedMotion) return true;
  let score = 0;
  if (signals.hardwareConcurrencyLow) score += 1;
  if (signals.deviceMemoryLow) score += 1;
  if (signals.saveDataEnabled) score += 1;
  return score >= 2;
}

const DeviceTierContext = createContext<UseDeviceTierResult | null>(null);

/**
 * Оптимизация: бұрын әр компонентте useDeviceTier() — жеке state + matchMedia.
 * Қазір бір контекст — тыңдаушы мен localStorage бір рет.
 */
export function DeviceTierProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<PerformanceMode>(readStoredMode);
  const [signals, setSignals] = useState<DeviceSignals>(readSignals);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setSignals(readSignals());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setMode = useCallback((next: PerformanceMode) => {
    setModeState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PERF_MODE_KEY, next);
    }
  }, []);

  const isLowEnd = useMemo(() => {
    if (signals.reducedMotion) return true;
    if (mode === "low") return true;
    if (mode === "high") return false;
    return autoLowFromSignals(signals);
  }, [mode, signals]);

  const value = useMemo<UseDeviceTierResult>(
    () => ({ mode, setMode, isLowEnd, signals }),
    [mode, setMode, isLowEnd, signals]
  );

  return React.createElement(DeviceTierContext.Provider, { value }, children);
}

export function useDeviceTier(): UseDeviceTierResult {
  const ctx = useContext(DeviceTierContext);
  if (!ctx) {
    throw new Error("useDeviceTier must be used within <DeviceTierProvider>");
  }
  return ctx;
}
