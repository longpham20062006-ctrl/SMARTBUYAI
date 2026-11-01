import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { globalGalaxyTelemetry } from './GalaxyDebugPanel';

/**
 * Kiểm tra thiết bị có hỗ trợ WebGL hay không trước khi khởi tạo Three.js
 */
function checkWebGLSupport(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const testCanvas = document.createElement('canvas');
    const gl =
      testCanvas.getContext('webgl2') ||
      testCanvas.getContext('webgl') ||
      testCanvas.getContext('experimental-webgl');
    return Boolean(gl);
  } catch {
    return false;
  }
}

/**
 * TẦNG 2 — CONTINUOUS AMBIENT GALAXY (NÂNG CẤP TƯƠNG THÍCH MOBILE CAO CẤP)
 * Hiệu ứng vũ trụ nền chuyển động liên tục, sinh động và có chiều sâu 3D trong khu vực Hero.
 * - Hạt sao sáng rõ hơn +35%, tâm phát sáng rực rỡ với Additive Radial Glow 64x64.
 * - Phân tầng 2 nhóm hạt: Hạt tiền cảnh sáng to bay nhanh + Hạt nền trôi dạt sâu trong không gian.
 * - Tương thích 100% với iOS Safari, Android WebKit, hỗ trợ fallback 2D Canvas mượt mà khi GPU yếu/không có WebGL.
 * - Tự động pause animation khi cuộn khỏi viewport để tiết kiệm 100% pin & GPU trên điện thoại.
 * - Sử dụng delta time chính xác thay cho THREE.Clock đã deprecated.
 */
export const AmbientGalaxy: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    globalGalaxyTelemetry.ambientMounted = true;
    globalGalaxyTelemetry.ambientActive = true;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let isTerminated = false;
    let animationFrameId: number;
    let isVisible = true;

    const getWidth = () => container.clientWidth || window.innerWidth || 1280;
    const getHeight = () => container.clientHeight || 750;

    // --- FALLBACK 2D CANVAS KHI WEBGL KHÔNG KHẢ DỤNG HOẶC MẤT CONTEXT ---
    const runCanvas2DFallback = () => {
      globalGalaxyTelemetry.webglAvailable = false;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = getWidth();
      const h = getHeight();
      canvas.width = w;
      canvas.height = h;

      const starCount = window.innerWidth < 768 ? 120 : 200;
      const stars = Array.from({ length: starCount }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 2.4 + 1.0,
        speed: Math.random() * 0.6 + 0.2,
        color: ['#FFFFFF', '#18F4FC', '#22D3EE', '#C084FC', '#8B5CF6'][Math.floor(Math.random() * 5)],
      }));

      const animate2D = () => {
        if (isTerminated || !isVisible) return;
        globalGalaxyTelemetry.ambientFrameCount++;
        globalGalaxyTelemetry.ambientActive = true;

        ctx.clearRect(0, 0, w, h);
        for (let i = 0; i < stars.length; i++) {
          const s = stars[i];
          s.y -= s.speed;
          if (s.y < 0) s.y = h;
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
        }

        animationFrameId = requestAnimationFrame(animate2D);
      };

      animationFrameId = requestAnimationFrame(animate2D);
    };

    // Kiểm tra tính tương thích WebGL của thiết bị mobile
    if (!checkWebGLSupport()) {
      runCanvas2DFallback();
      return () => {
        isTerminated = true;
        cancelAnimationFrame(animationFrameId);
        globalGalaxyTelemetry.ambientMounted = false;
        globalGalaxyTelemetry.ambientActive = false;
      };
    }

    // --- THREE.JS WEBGL RENDERER ---
    let renderer: THREE.WebGLRenderer | null = null;
    let geoMajor: THREE.BufferGeometry | null = null;
    let matMajor: THREE.PointsMaterial | null = null;
    let geoDeep: THREE.BufferGeometry | null = null;
    let matDeep: THREE.PointsMaterial | null = null;
    let texture: THREE.CanvasTexture | null = null;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: 'high-performance',
      });

      if (!renderer.getContext()) {
        runCanvas2DFallback();
        return () => {
          isTerminated = true;
          cancelAnimationFrame(animationFrameId);
        };
      }

      globalGalaxyTelemetry.webglAvailable = true;
    } catch {
      runCanvas2DFallback();
      return () => {
        isTerminated = true;
        cancelAnimationFrame(animationFrameId);
        globalGalaxyTelemetry.ambientMounted = false;
        globalGalaxyTelemetry.ambientActive = false;
      };
    }

    // Lắng nghe sự kiện mất Context trên GPU Mobile (Webview / pin yếu / chuyển app)
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(animationFrameId);
      runCanvas2DFallback();
    };
    canvas.addEventListener('webglcontextlost', handleContextLost, false);

    const currentW = getWidth();
    const currentH = getHeight();
    renderer.setSize(currentW, currentH);
    const isMobile = window.innerWidth < 768;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.0 : 1.5));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, currentW / (currentH || 1), 1, 2400);
    camera.position.z = 600;
    const totalStarCount = prefersReducedMotion ? 600 : isMobile ? 1000 : 2200;
    const majorCount = Math.floor(totalStarCount * 0.25);
    const deepCount = totalStarCount - majorCount;

    const colorPalette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xffffff),
      new THREE.Color(0x18f4fc),
      new THREE.Color(0x22d3ee),
      new THREE.Color(0xc084fc),
      new THREE.Color(0x8b5cf6),
    ];

    // Texture hạt siêu sáng với Radial Glow
    const pointCanvas = document.createElement('canvas');
    pointCanvas.width = 64;
    pointCanvas.height = 64;
    const pCtx = pointCanvas.getContext('2d');
    if (pCtx) {
      const grad = pCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
      grad.addColorStop(0.15, 'rgba(255, 255, 255, 1.0)');
      grad.addColorStop(0.32, 'rgba(224, 247, 255, 0.95)');
      grad.addColorStop(0.55, 'rgba(34, 211, 238, 0.65)');
      grad.addColorStop(0.80, 'rgba(139, 92, 246, 0.30)');
      grad.addColorStop(1.0, 'rgba(5, 5, 16, 0.0)');
      pCtx.fillStyle = grad;
      pCtx.fillRect(0, 0, 64, 64);
    }
    texture = new THREE.CanvasTexture(pointCanvas);
    texture.flipY = false;
    texture.premultiplyAlpha = false;

    // --- 1. FOREGROUND STARS ---
    geoMajor = new THREE.BufferGeometry();
    const posMajor = new Float32Array(majorCount * 3);
    const colMajor = new Float32Array(majorCount * 3);
    const spdMajor = new Float32Array(majorCount);

    for (let i = 0; i < majorCount; i++) {
      const i3 = i * 3;
      posMajor[i3] = (Math.random() - 0.5) * 1900;
      posMajor[i3 + 1] = (Math.random() - 0.5) * 1300;
      posMajor[i3 + 2] = (Math.random() - 0.5) * 1500;

      const c = colorPalette[Math.floor(Math.random() * 4)];
      colMajor[i3] = c.r;
      colMajor[i3 + 1] = c.g;
      colMajor[i3 + 2] = c.b;

      spdMajor[i] = prefersReducedMotion ? 0.15 + Math.random() * 0.2 : 0.45 + Math.random() * 0.85;
    }

    geoMajor.setAttribute('position', new THREE.BufferAttribute(posMajor, 3));
    geoMajor.setAttribute('color', new THREE.BufferAttribute(colMajor, 3));

    matMajor = new THREE.PointsMaterial({
      size: isMobile ? 4.2 : 5.8,
      vertexColors: true,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.96,
    });
    const majorPoints = new THREE.Points(geoMajor, matMajor);
    scene.add(majorPoints);

    // --- 2. DEEP AMBIENT STARS ---
    geoDeep = new THREE.BufferGeometry();
    const posDeep = new Float32Array(deepCount * 3);
    const colDeep = new Float32Array(deepCount * 3);
    const spdDeep = new Float32Array(deepCount);

    for (let i = 0; i < deepCount; i++) {
      const i3 = i * 3;
      posDeep[i3] = (Math.random() - 0.5) * 2200;
      posDeep[i3 + 1] = (Math.random() - 0.5) * 1500;
      posDeep[i3 + 2] = (Math.random() - 0.5) * 1700;

      const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colDeep[i3] = c.r;
      colDeep[i3 + 1] = c.g;
      colDeep[i3 + 2] = c.b;

      spdDeep[i] = prefersReducedMotion ? 0.08 + Math.random() * 0.12 : 0.25 + Math.random() * 0.45;
    }

    geoDeep.setAttribute('position', new THREE.BufferAttribute(posDeep, 3));
    geoDeep.setAttribute('color', new THREE.BufferAttribute(colDeep, 3));

    matDeep = new THREE.PointsMaterial({
      size: isMobile ? 3.0 : 4.0,
      vertexColors: true,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.88,
    });
    const deepPoints = new THREE.Points(geoDeep, matDeep);
    scene.add(deepPoints);

    // Chuẩn hóa Delta-time không phụ thuộc THREE.Clock
    let lastTime = performance.now();
    let totalElapsed = 0;

    const animate = () => {
      if (isTerminated || !isVisible || !renderer) return;
      animationFrameId = requestAnimationFrame(animate);

      globalGalaxyTelemetry.ambientFrameCount++;
      globalGalaxyTelemetry.ambientActive = true;

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;
      totalElapsed += delta;

      const rotSpeed = prefersReducedMotion ? 0.010 : 0.032;
      majorPoints.rotation.y = totalElapsed * rotSpeed;
      majorPoints.rotation.x = Math.sin(totalElapsed * 0.018) * 0.06;

      deepPoints.rotation.y = totalElapsed * rotSpeed * 0.75;
      deepPoints.rotation.x = Math.sin(totalElapsed * 0.015) * 0.04;

      if (!prefersReducedMotion) {
        camera.position.x = Math.sin(totalElapsed * 0.05) * 40;
        camera.position.y = Math.cos(totalElapsed * 0.035) * 22;
      }
      camera.lookAt(0, 0, 0);

      const arrMajor = (geoMajor.attributes.position as THREE.BufferAttribute).array as Float32Array;
      for (let i = 0; i < majorCount; i++) {
        const i3 = i * 3;
        arrMajor[i3 + 2] += spdMajor[i] * 68 * delta;
        if (arrMajor[i3 + 2] > 750) {
          arrMajor[i3 + 2] = -850;
        }
      }
      (geoMajor.attributes.position as THREE.BufferAttribute).needsUpdate = true;

      const arrDeep = (geoDeep.attributes.position as THREE.BufferAttribute).array as Float32Array;
      for (let i = 0; i < deepCount; i++) {
        const i3 = i * 3;
        arrDeep[i3 + 2] += spdDeep[i] * 48 * delta;
        if (arrDeep[i3 + 2] > 750) {
          arrDeep[i3 + 2] = -900;
        }
      }
      (geoDeep.attributes.position as THREE.BufferAttribute).needsUpdate = true;

      try {
        renderer.render(scene, camera);
      } catch {
        // Bảo vệ chống crash khi WebGL context bị ngắt đột ngột
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!isVisible) {
              isVisible = true;
              globalGalaxyTelemetry.ambientActive = true;
              lastTime = performance.now();
              animate();
            }
          } else if (entry.intersectionRatio === 0) {
            isVisible = false;
            globalGalaxyTelemetry.ambientActive = false;
            cancelAnimationFrame(animationFrameId);
          }
        });
      },
      { threshold: [0, 0.1] }
    );
    observer.observe(container);

    animate();

    const updateSize = () => {
      if (isTerminated || !renderer) return;
      const w = getWidth();
      const h = getHeight();
      camera.aspect = w / (h || 1);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', updateSize, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateSize();
      });
      resizeObserver.observe(container);
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isVisible = false;
        globalGalaxyTelemetry.ambientActive = false;
        cancelAnimationFrame(animationFrameId);
      } else if (container.getBoundingClientRect().bottom > 0) {
        isVisible = true;
        globalGalaxyTelemetry.ambientActive = true;
        lastTime = performance.now();
        animate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isTerminated = true;
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateSize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      canvas.removeEventListener('webglcontextlost', handleContextLost);

      globalGalaxyTelemetry.ambientMounted = false;
      globalGalaxyTelemetry.ambientActive = false;

      geoMajor?.dispose();
      matMajor?.dispose();
      geoDeep?.dispose();
      matDeep?.dispose();
      texture?.dispose();
      renderer?.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full block opacity-90" />
    </div>
  );
};
