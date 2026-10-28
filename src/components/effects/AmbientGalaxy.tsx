import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { globalGalaxyTelemetry } from './GalaxyDebugPanel';

/**
 * TẦNG 2 — CONTINUOUS AMBIENT GALAXY (NÂNG CẤP V2)
 * Hiệu ứng Three.js vũ trụ nền chuyển động liên tục, sinh động và có chiều sâu 3D trong khu vực Hero.
 * - Hạt sao sáng rõ hơn +35%, tâm phát sáng rực rỡ với Additive Radial Glow 64x64.
 * - Tốc độ di chuyển tăng +50% so với bản cũ, cảm giác bay nhẹ nhàng sống động theo thời gian thực (Delta-time).
 * - Phân tầng 2 nhóm hạt: Hạt tiền cảnh sáng to bay nhanh + Hạt nền trôi dạt sâu trong không gian.
 * - Tự động pause animation khi cuộn khỏi viewport để tiết kiệm 100% GPU.
 * - pointer-events: none bảo đảm 100% khả năng tương tác với nút CTA, link và văn bản.
 */
export const AmbientGalaxy: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // 1. Cập nhật Telemetry
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

    // --- FALLBACK 2D CANVAS KHI WEBGL KHÔNG KHẢ DỤNG ---
    const runCanvas2DFallback = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = getWidth();
      const h = getHeight();
      canvas.width = w;
      canvas.height = h;

      const starCount = 200;
      const stars = Array.from({ length: starCount }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 2.8 + 1.2,
        speed: Math.random() * 0.7 + 0.25,
        color: ['#FFFFFF', '#18F4FC', '#22D3EE', '#C084FC', '#8B5CF6'][Math.floor(Math.random() * 5)],
      }));

      const animate2D = () => {
        if (isTerminated || !isVisible) return;
        globalGalaxyTelemetry.ambientFrameCount++;
        globalGalaxyTelemetry.ambientActive = true;

        ctx.clearRect(0, 0, w, h);
        stars.forEach((s) => {
          s.y -= s.speed;
          if (s.y < 0) s.y = h;
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
        });

        animationFrameId = requestAnimationFrame(animate2D);
      };

      animationFrameId = requestAnimationFrame(animate2D);
    };

    // --- THREE.JS WEBGL RENDERER ---
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: 'high-performance',
      });
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

    const currentW = getWidth();
    const currentH = getHeight();
    renderer.setSize(currentW, currentH);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, currentW / currentH, 1, 2400);
    camera.position.z = 600;

    const isMobile = window.innerWidth < 768;
    const totalStarCount = prefersReducedMotion ? 900 : isMobile ? 1500 : 2800;
    const majorCount = Math.floor(totalStarCount * 0.25); // 25% hạt sáng to bay nhanh
    const deepCount = totalStarCount - majorCount;        // 75% hạt nền không gian sâu

    // Palette sáng rực rỡ: Trắng, Cyan, Lavender, Tím
    const colorPalette = [
      new THREE.Color(0xffffff), // Radiant White
      new THREE.Color(0xffffff), // Radiant White
      new THREE.Color(0x18f4fc), // Bright Cyan
      new THREE.Color(0x22d3ee), // Cyan
      new THREE.Color(0xc084fc), // Soft Lavender
      new THREE.Color(0x8b5cf6), // Purple
    ];

    // Particle Texture siêu sáng 64x64 Additive Radial Glow
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
    const texture = new THREE.CanvasTexture(pointCanvas);

    // --- 1. MAJOR FOREGROUND LUMINOUS STARS ---
    const geoMajor = new THREE.BufferGeometry();
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

      // Tốc độ di chuyển tăng +50% so với cũ
      spdMajor[i] = prefersReducedMotion ? 0.15 + Math.random() * 0.2 : 0.45 + Math.random() * 0.85;
    }

    geoMajor.setAttribute('position', new THREE.BufferAttribute(posMajor, 3));
    geoMajor.setAttribute('color', new THREE.BufferAttribute(colMajor, 3));

    // Kích thước hạt lớn tăng +30% (desktop 6.2px, mobile 4.8px)
    const matMajor = new THREE.PointsMaterial({
      size: isMobile ? 4.8 : 6.2,
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
    const geoDeep = new THREE.BufferGeometry();
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

      // Vận tốc hạt sâu: 0.25 - 0.6
      spdDeep[i] = prefersReducedMotion ? 0.08 + Math.random() * 0.12 : 0.25 + Math.random() * 0.45;
    }

    geoDeep.setAttribute('position', new THREE.BufferAttribute(posDeep, 3));
    geoDeep.setAttribute('color', new THREE.BufferAttribute(colDeep, 3));

    // Kích thước hạt nền: desktop 4.4px, mobile 3.2px
    const matDeep = new THREE.PointsMaterial({
      size: isMobile ? 3.2 : 4.4,
      vertexColors: true,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.88,
    });
    const deepPoints = new THREE.Points(geoDeep, matDeep);
    scene.add(deepPoints);

    // Animation loop & pause mechanism với Delta-time chuẩn xác
    let clock = new THREE.Clock();

    const animate = () => {
      if (isTerminated || !isVisible) return;
      animationFrameId = requestAnimationFrame(animate);

      globalGalaxyTelemetry.ambientFrameCount++;
      globalGalaxyTelemetry.ambientActive = true;

      const delta = Math.min(clock.getDelta(), 0.08);
      const time = clock.getElapsedTime();

      // Gentle continuous rotation (tăng nhẹ độ sinh động)
      const rotSpeed = prefersReducedMotion ? 0.010 : 0.032;
      majorPoints.rotation.y = time * rotSpeed;
      majorPoints.rotation.x = Math.sin(time * 0.018) * 0.06;

      deepPoints.rotation.y = time * rotSpeed * 0.75;
      deepPoints.rotation.x = Math.sin(time * 0.015) * 0.04;

      // Camera gentle breathing
      if (!prefersReducedMotion) {
        camera.position.x = Math.sin(time * 0.05) * 40;
        camera.position.y = Math.cos(time * 0.035) * 22;
      }
      camera.lookAt(0, 0, 0);

      // Cập nhật vị trí hạt lớn (Bay nhanh hơn +55% tạo chiều sâu 3D rõ rệt)
      const arrMajor = (geoMajor.attributes.position as THREE.BufferAttribute).array as Float32Array;
      for (let i = 0; i < majorCount; i++) {
        const i3 = i * 3;
        arrMajor[i3 + 2] += spdMajor[i] * 68 * delta;
        if (arrMajor[i3 + 2] > 750) {
          arrMajor[i3 + 2] = -850;
        }
      }
      (geoMajor.attributes.position as THREE.BufferAttribute).needsUpdate = true;

      // Cập nhật vị trí hạt nền sâu
      const arrDeep = (geoDeep.attributes.position as THREE.BufferAttribute).array as Float32Array;
      for (let i = 0; i < deepCount; i++) {
        const i3 = i * 3;
        arrDeep[i3 + 2] += spdDeep[i] * 48 * delta;
        if (arrDeep[i3 + 2] > 750) {
          arrDeep[i3 + 2] = -900;
        }
      }
      (geoDeep.attributes.position as THREE.BufferAttribute).needsUpdate = true;

      renderer.render(scene, camera);
    };

    // Pause when hero scrolled completely out of viewport (intersectionRatio == 0)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!isVisible) {
              isVisible = true;
              globalGalaxyTelemetry.ambientActive = true;
              clock.start();
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

    // Start initial loop
    animate();

    const updateSize = () => {
      if (isTerminated) return;
      const w = getWidth();
      const h = getHeight();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', updateSize);

    // ResizeObserver tracks container DOM size changes
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateSize();
      });
      resizeObserver.observe(container);
    }

    // Page visibility (tab switch) pause
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isVisible = false;
        globalGalaxyTelemetry.ambientActive = false;
        cancelAnimationFrame(animationFrameId);
      } else if (container.getBoundingClientRect().bottom > 0) {
        isVisible = true;
        globalGalaxyTelemetry.ambientActive = true;
        clock.start();
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

      globalGalaxyTelemetry.ambientMounted = false;
      globalGalaxyTelemetry.ambientActive = false;

      geoMajor.dispose();
      matMajor.dispose();
      geoDeep.dispose();
      matDeep.dispose();
      texture.dispose();
      renderer.dispose();
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
