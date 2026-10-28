import React, { useEffect, useState } from 'react';

export interface GalaxyTelemetry {
  introMounted: boolean;
  ambientMounted: boolean;
  webglAvailable: boolean;
  rendererInitialized: boolean;
  canvasWidth: number;
  canvasHeight: number;
  animationRunning: boolean;
  frameCount: number;
  currentPhase: string;
  ambientActive: boolean;
  ambientFrameCount: number;
  prefersReducedMotion: boolean;
  lastError: string | null;
}

export const globalGalaxyTelemetry: GalaxyTelemetry = {
  introMounted: false,
  ambientMounted: false,
  webglAvailable: false,
  rendererInitialized: false,
  canvasWidth: 0,
  canvasHeight: 0,
  animationRunning: false,
  frameCount: 0,
  currentPhase: 'Idle',
  ambientActive: false,
  ambientFrameCount: 0,
  prefersReducedMotion: false,
  lastError: null,
};

if (typeof window !== 'undefined') {
  (window as any).__galaxyTelemetry = globalGalaxyTelemetry;
}

interface GalaxyDebugPanelProps {
  onReplayIntro?: () => void;
}

export const GalaxyDebugPanel: React.FC<GalaxyDebugPanelProps> = ({ onReplayIntro }) => {
  const [data, setData] = useState<GalaxyTelemetry>({ ...globalGalaxyTelemetry });
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    // Check if ?debugGalaxy=1 is in URL
    const params = new URLSearchParams(window.location.search);
    const isDebug = params.get('debugGalaxy') === '1' || process.env.NODE_ENV === 'development';
    if (!isDebug) return;

    const interval = setInterval(() => {
      setData({ ...globalGalaxyTelemetry });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  if (!params || params.get('debugGalaxy') !== '1') {
    return null;
  }

  return (
    <aside
      aria-label="Galaxy 3D Debug Telemetry"
      className="fixed bottom-4 left-4 z-50 bg-[#050510]/95 text-white p-3.5 rounded-xl border border-[#22D3EE]/40 backdrop-blur-md shadow-2xl font-mono text-[11px] max-w-sm pointer-events-auto transition-all"
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/15">
        <div className="flex items-center gap-1.5 font-bold text-[#22D3EE] uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#22D3EE] animate-ping" />
          <span>Galaxy 3D Telemetry</span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-white/60 hover:text-white text-[10px] px-1.5 py-0.5 rounded bg-white/10"
        >
          {isOpen ? 'Thu nhỏ' : 'Mở rộng'}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-[#A1A1AA]">Intro Mounted:</span>
            <span className={data.introMounted ? 'text-[#4ADE80] font-bold' : 'text-[#71717A]'}>
              {data.introMounted ? 'YES' : 'NO'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-[#A1A1AA]">WebGL Available:</span>
            <span className={data.webglAvailable ? 'text-[#4ADE80] font-bold' : 'text-[#EF4444] font-bold'}>
              {data.webglAvailable ? 'YES' : 'NO (Using 2D Fallback)'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-[#A1A1AA]">Renderer Initialized:</span>
            <span className={data.rendererInitialized ? 'text-[#4ADE80] font-bold' : 'text-[#EF4444]'}>
              {data.rendererInitialized ? 'YES' : 'NO'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-[#A1A1AA]">Canvas Size:</span>
            <span className="text-[#22D3EE]">{data.canvasWidth} x {data.canvasHeight} px</span>
          </div>

          <div className="flex justify-between">
            <span className="text-[#A1A1AA]">Animation Running:</span>
            <span className={data.animationRunning ? 'text-[#4ADE80] font-bold' : 'text-[#EF4444]'}>
              {data.animationRunning ? 'YES' : 'NO'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-[#A1A1AA]">Intro Frames:</span>
            <span className="text-[#F472B6] font-bold">{data.frameCount}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-[#A1A1AA]">Intro Phase:</span>
            <span className="text-[#A78BFA] font-bold">{data.currentPhase}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-[#A1A1AA]">Ambient Active:</span>
            <span className={data.ambientActive ? 'text-[#4ADE80] font-bold' : 'text-[#71717A]'}>
              {data.ambientActive ? 'YES' : 'NO'} (Frames: {data.ambientFrameCount})
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-[#A1A1AA]">Reduced Motion OS:</span>
            <span className={data.prefersReducedMotion ? 'text-[#F59E0B] font-bold' : 'text-[#A1A1AA]'}>
              {data.prefersReducedMotion ? 'DETECTED' : 'OFF'}
            </span>
          </div>

          {data.lastError && (
            <div className="pt-1 text-[#EF4444] text-[10px] break-words bg-red-950/40 p-1.5 rounded border border-red-800/50">
              ⚠️ Lỗi: {data.lastError}
            </div>
          )}

          <div className="pt-2 border-t border-white/10 flex gap-2">
            {onReplayIntro && (
              <button
                type="button"
                onClick={onReplayIntro}
                className="w-full py-1 rounded bg-[#8B5CF6] hover:bg-[#7C3AED] active:scale-95 text-white font-bold transition-all text-center"
              >
                Phát lại Intro 3D
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
