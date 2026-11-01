import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { safeLocalStorage } from '@/lib/storage';

export type PerformanceMode = 'auto' | 'standard' | 'saver';

interface DeviceSpecs {
  isMobile: boolean;
  isLowSpec: boolean;
  hardwareConcurrency: number;
  deviceMemory: number | null;
  prefersReducedMotion: boolean;
}

interface PerformanceContextType {
  mode: PerformanceMode;
  effectiveMode: 'standard' | 'saver';
  isSaver: boolean;
  deviceSpecs: DeviceSpecs;
  setMode: (mode: PerformanceMode) => void;
}

const STORAGE_KEY = 'sb_perf_mode';

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

function detectSpecs(): DeviceSpecs {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isLowSpec: false,
      hardwareConcurrency: 4,
      deviceMemory: null,
      prefersReducedMotion: false,
    };
  }

  const isMobile =
    window.innerWidth < 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const concurrency = navigator.hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory || null;
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false;

  // Máy cấu hình yếu: CPU <= 4 luồng, RAM <= 4GB, hoặc thiết bị di động tầm thấp
  const isLowSpec = concurrency <= 4 || (memory !== null && memory <= 4);

  return {
    isMobile,
    isLowSpec,
    hardwareConcurrency: concurrency,
    deviceMemory: memory,
    prefersReducedMotion,
  };
}

export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<PerformanceMode>(() => {
    const saved = safeLocalStorage.getItem(STORAGE_KEY) as PerformanceMode | null;
    return saved === 'standard' || saved === 'saver' ? saved : 'auto';
  });

  const [specs, setSpecs] = useState<DeviceSpecs>(detectSpecs);

  useEffect(() => {
    const handleResize = () => {
      setSpecs(detectSpecs());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const setMode = (newMode: PerformanceMode) => {
    setModeState(newMode);
    safeLocalStorage.setItem(STORAGE_KEY, newMode);
  };

  const effectiveMode: 'standard' | 'saver' = useMemo(() => {
    if (mode === 'saver') return 'saver';
    if (mode === 'standard') return 'standard';

    // Chế độ Auto: tự động kích hoạt Saver nếu là máy yếu hoặc bật reduced motion
    if (specs.prefersReducedMotion || (specs.isMobile && specs.isLowSpec)) {
      return 'saver';
    }
    return 'standard';
  }, [mode, specs]);

  const value = useMemo(
    () => ({
      mode,
      effectiveMode,
      isSaver: effectiveMode === 'saver',
      deviceSpecs: specs,
      setMode,
    }),
    [mode, effectiveMode, specs]
  );

  return <PerformanceContext.Provider value={value}>{children}</PerformanceContext.Provider>;
};

export const usePerformance = (): PerformanceContextType => {
  const context = useContext(PerformanceContext);
  if (!context) {
    // Fallback an toàn nếu component nằm ngoài Provider
    const fallbackSpecs = detectSpecs();
    return {
      mode: 'auto',
      effectiveMode: 'standard',
      isSaver: false,
      deviceSpecs: fallbackSpecs,
      setMode: () => {},
    };
  }
  return context;
};

