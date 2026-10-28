import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { X, Sparkles } from 'lucide-react';
import { globalGalaxyTelemetry } from './GalaxyDebugPanel';

interface GalaxyIntroProps {
  onComplete: () => void;
  forcePlay?: boolean;
}

export const GalaxyIntro: React.FC<GalaxyIntroProps> = ({ onComplete, forcePlay = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showLogo, setShowLogo] = useState(false);

  // Lưu onComplete vào ref để tránh re-trigger effect khi parent re-render
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // 1. Cập nhật Telemetry khi Intro Mount
    globalGalaxyTelemetry.introMounted = true;
    globalGalaxyTelemetry.frameCount = 0;
    globalGalaxyTelemetry.currentPhase = 'Initializing';
    globalGalaxyTelemetry.lastError = null;

    // 2. Kiểm tra prefers-reduced-motion (tôn trọng cài đặt trợ năng)
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    globalGalaxyTelemetry.prefersReducedMotion = prefersReducedMotion;

    const canvas = canvasRef.current;
    if (!canvas) {
      globalGalaxyTelemetry.lastError = 'Canvas element not found';
      onCompleteRef.current();
      return;
    }

    const width = window.innerWidth || 1280;
    const height = window.innerHeight || 800;
    globalGalaxyTelemetry.canvasWidth = width;
    globalGalaxyTelemetry.canvasHeight = height;

    let isTerminated = false;
    let animationFrameId: number;

    // Helper tạo Texture hạt sao siêu sáng 64x64 với Additive Radial Glow
    const createSuperGlowTexture = () => {
      const pCanvas = document.createElement('canvas');
      pCanvas.width = 64;
      pCanvas.height = 64;
      const pCtx = pCanvas.getContext('2d');
      if (pCtx) {
        const grad = pCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
        // Tâm sao trắng tinh khiết rực rỡ (+35% độ sáng)
        grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        grad.addColorStop(0.14, 'rgba(255, 255, 255, 1.0)');
        // Vành trong pha ánh sáng xanh băng
        grad.addColorStop(0.30, 'rgba(224, 247, 255, 0.95)');
        // Vầng hào quang Cyan & Tím thương hiệu
        grad.addColorStop(0.52, 'rgba(34, 211, 238, 0.70)');
        grad.addColorStop(0.78, 'rgba(139, 92, 246, 0.35)');
        grad.addColorStop(1.0, 'rgba(5, 5, 16, 0.0)');
        pCtx.fillStyle = grad;
        pCtx.fillRect(0, 0, 64, 64);
      }
      return new THREE.CanvasTexture(pCanvas);
    };

    // Forward declarations for cleanup
    let handleResize: () => void = () => {};
    let handleKeyDown: (e: KeyboardEvent) => void = () => {};
    let cleanupResources: () => void = () => {};

    // KẾT THÚC VÀ BÁO HOÀN THÀNH
    const finishIntro = () => {
      if (isTerminated) return;
      globalGalaxyTelemetry.introMounted = false;
      globalGalaxyTelemetry.animationRunning = false;
      globalGalaxyTelemetry.currentPhase = 'Completed';
      cleanupResources();
      onCompleteRef.current();
    };

    // --- FALLBACK 2D CANVAS KHI WEBGL KHÔNG KHẢ DỤNG ---
    const runCanvas2DFallback = () => {
      globalGalaxyTelemetry.webglAvailable = false;
      globalGalaxyTelemetry.rendererInitialized = false;
      globalGalaxyTelemetry.animationRunning = true;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        globalGalaxyTelemetry.lastError = 'Neither WebGL nor 2D Context available';
        finishIntro();
        return;
      }

      canvas.width = width;
      canvas.height = height;

      const numParticles = 400;
      const particles = Array.from({ length: numParticles }, () => ({
        x: (Math.random() - 0.5) * width,
        y: (Math.random() - 0.5) * height,
        z: Math.random() * 1000 + 1,
        size: Math.random() * 2.5 + 1.5,
        color: ['#FFFFFF', '#22D3EE', '#18F4FC', '#C084FC', '#8B5CF6'][Math.floor(Math.random() * 5)],
      }));

      const startTime = performance.now();

      const animate2D = (now: number) => {
        if (isTerminated) return;
        const elapsed = (now - startTime) / 1000;
        globalGalaxyTelemetry.frameCount++;

        if (elapsed < 1.2) {
          globalGalaxyTelemetry.currentPhase = 'Starfield (2D)';
        } else if (elapsed < 2.6) {
          globalGalaxyTelemetry.currentPhase = 'Hyperspace (2D)';
        } else if (elapsed < 3.7) {
          globalGalaxyTelemetry.currentPhase = 'Galaxy Explosion (2D)';
        } else if (elapsed < 4.8) {
          globalGalaxyTelemetry.currentPhase = 'Brand Reveal (2D)';
          if (!showLogo) setShowLogo(true);
        } else {
          globalGalaxyTelemetry.currentPhase = 'Hero Transition (2D)';
          if (!isFadingOut) setIsFadingOut(true);
        }

        if (elapsed >= 5.5) {
          finishIntro();
          return;
        }

        ctx.fillStyle = 'rgba(5, 5, 16, 0.28)';
        ctx.fillRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;
        // Tăng tốc độ 2D fallback +50%
        const speed = elapsed > 1.2 && elapsed <= 2.6 ? 38 : 6.5;

        particles.forEach((p) => {
          p.z -= speed;
          if (p.z <= 0) {
            p.z = 1000;
            p.x = (Math.random() - 0.5) * width;
            p.y = (Math.random() - 0.5) * height;
          }
          const k = 450 / p.z;
          const px = p.x * k + cx;
          const py = p.y * k + cy;
          if (px >= 0 && px < width && py >= 0 && py < height) {
            const rad = Math.max(1.2, (1 - p.z / 1000) * p.size * 2.2);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(px, py, rad, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        animationFrameId = requestAnimationFrame(animate2D);
      };

      cleanupResources = () => {
        if (isTerminated) return;
        isTerminated = true;
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('keydown', handleKeyDown);
      };

      handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') finishIntro();
      };
      window.addEventListener('keydown', handleKeyDown);

      animationFrameId = requestAnimationFrame(animate2D);
    };

    // --- KHỞI TẠO THREE.JS WEBGL RENDERER ---
    let renderer: THREE.WebGLRenderer;
    let starGlowTex: THREE.CanvasTexture | null = null;
    let starGeoMajor: THREE.BufferGeometry | null = null;
    let starMatMajor: THREE.PointsMaterial | null = null;
    let starGeoDeep: THREE.BufferGeometry | null = null;
    let starMatDeep: THREE.PointsMaterial | null = null;
    let expGeo: THREE.BufferGeometry | null = null;
    let expMat: THREE.PointsMaterial | null = null;
    let ringGeo: THREE.RingGeometry | null = null;
    let ringMat: THREE.MeshBasicMaterial | null = null;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: false,
        antialias: true,
        powerPreference: 'high-performance',
      });
      globalGalaxyTelemetry.webglAvailable = true;
      globalGalaxyTelemetry.rendererInitialized = true;
    } catch (err: any) {
      globalGalaxyTelemetry.lastError = `WebGL Init Failed: ${err?.message || err}. Using 2D fallback.`;
      runCanvas2DFallback();
      return () => {
        isTerminated = true;
        cancelAnimationFrame(animationFrameId);
        globalGalaxyTelemetry.introMounted = false;
        globalGalaxyTelemetry.animationRunning = false;
      };
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);
    scene.fog = new THREE.FogExp2(0x050510, 0.0009);

    const camera = new THREE.PerspectiveCamera(65, width / height, 1, 3500);
    camera.position.z = 800;

    const isMobile = width < 768;
    // Tối ưu số lượng hạt: phân tầng 2 nhóm (Major Foreground Stars + Deep Nebula Stars)
    const totalStarCount = prefersReducedMotion ? 2200 : isMobile ? 3800 : 7500;
    const majorCount = Math.floor(totalStarCount * 0.28); // 28% hạt sao lớn sáng rực rỡ cận cảnh
    const deepCount = totalStarCount - majorCount;        // 72% hạt sao tầm trung & nền sâu
    const explosionCount = prefersReducedMotion ? 1200 : isMobile ? 2200 : 4800;

    // Palette màu sắc: 40% Trắng tinh khiết, 30% Cyan neon, 20% Tím nhạt, 10% Tím đậm
    const brightPalette = [
      new THREE.Color(0xffffff), // Radiant White
      new THREE.Color(0xffffff), // Radiant White
      new THREE.Color(0x18f4fc), // Bright Cyan Neon
      new THREE.Color(0x22d3ee), // Cyan
      new THREE.Color(0xc084fc), // Soft Lavender
      new THREE.Color(0x8b5cf6), // Deep Purple
    ];

    starGlowTex = createSuperGlowTexture();

    // --- A1. MAJOR LUMINOUS STARS (Hạt sao lớn, sáng rực rỡ, bay cận cảnh) ---
    starGeoMajor = new THREE.BufferGeometry();
    const majorPos = new Float32Array(majorCount * 3);
    const majorCols = new Float32Array(majorCount * 3);
    const majorVels = new Float32Array(majorCount);

    for (let i = 0; i < majorCount; i++) {
      const i3 = i * 3;
      majorPos[i3] = (Math.random() - 0.5) * 2000;
      majorPos[i3 + 1] = (Math.random() - 0.5) * 1500;
      majorPos[i3 + 2] = (Math.random() - 0.5) * 2400;

      // Ưu tiên trắng và cyan neon cho hạt lớn
      const c = brightPalette[Math.floor(Math.random() * 4)];
      majorCols[i3] = c.r;
      majorCols[i3 + 1] = c.g;
      majorCols[i3 + 2] = c.b;

      // Vận tốc tăng 55% so với cũ: từ 1.0-3.5 lên 2.2-5.5
      majorVels[i] = 2.2 + Math.random() * 3.3;
    }

    starGeoMajor.setAttribute('position', new THREE.BufferAttribute(majorPos, 3));
    starGeoMajor.setAttribute('color', new THREE.BufferAttribute(majorCols, 3));

    // Kích thước hạt lớn tăng +30% (desktop 7.2px, mobile 5.2px)
    starMatMajor = new THREE.PointsMaterial({
      size: isMobile ? 5.2 : 7.2,
      map: starGlowTex,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const majorPoints = new THREE.Points(starGeoMajor, starMatMajor);
    scene.add(majorPoints);

    // --- A2. DEEP NEBULA STARS (Hạt sao tầm trung và nền không gian sâu) ---
    starGeoDeep = new THREE.BufferGeometry();
    const deepPos = new Float32Array(deepCount * 3);
    const deepCols = new Float32Array(deepCount * 3);
    const deepVels = new Float32Array(deepCount);

    for (let i = 0; i < deepCount; i++) {
      const i3 = i * 3;
      deepPos[i3] = (Math.random() - 0.5) * 2500;
      deepPos[i3 + 1] = (Math.random() - 0.5) * 1800;
      deepPos[i3 + 2] = (Math.random() - 0.5) * 2600;

      const c = brightPalette[Math.floor(Math.random() * brightPalette.length)];
      deepCols[i3] = c.r;
      deepCols[i3 + 1] = c.g;
      deepCols[i3 + 2] = c.b;

      // Vận tốc hạt sâu: 1.5 - 3.8 (+50% so với cũ)
      deepVels[i] = 1.5 + Math.random() * 2.3;
    }

    starGeoDeep.setAttribute('position', new THREE.BufferAttribute(deepPos, 3));
    starGeoDeep.setAttribute('color', new THREE.BufferAttribute(deepCols, 3));

    // Kích thước hạt sâu tăng +25% (desktop 4.5px, mobile 3.2px)
    starMatDeep = new THREE.PointsMaterial({
      size: isMobile ? 3.2 : 4.5,
      map: starGlowTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.90,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const deepPoints = new THREE.Points(starGeoDeep, starMatDeep);
    scene.add(deepPoints);

    // --- B. GALAXY EXPLOSION BURST PARTICLES ---
    expGeo = new THREE.BufferGeometry();
    const expPositions = new Float32Array(explosionCount * 3);
    const expColors = new Float32Array(explosionCount * 3);
    const expVelocities = new Float32Array(explosionCount * 3);

    for (let i = 0; i < explosionCount; i++) {
      const i3 = i * 3;
      expPositions[i3] = (Math.random() - 0.5) * 25;
      expPositions[i3 + 1] = (Math.random() - 0.5) * 25;
      expPositions[i3 + 2] = (Math.random() - 0.5) * 25;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      // Tốc độ nổ tăng 45% tạo sức bung tỏa mãnh liệt
      const speed = prefersReducedMotion ? 3.0 + Math.random() * 5.0 : 6.0 + Math.random() * 16.0;

      expVelocities[i3] = Math.sin(phi) * Math.cos(theta) * speed;
      expVelocities[i3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
      expVelocities[i3 + 2] = Math.cos(phi) * speed;

      const c = brightPalette[Math.floor(Math.random() * brightPalette.length)];
      expColors[i3] = c.r;
      expColors[i3 + 1] = c.g;
      expColors[i3 + 2] = c.b;
    }

    expGeo.setAttribute('position', new THREE.BufferAttribute(expPositions, 3));
    expGeo.setAttribute('color', new THREE.BufferAttribute(expColors, 3));

    // Kích thước hạt nổ tăng lên 8.5px (desktop) và 5.8px (mobile)
    expMat = new THREE.PointsMaterial({
      size: isMobile ? 5.8 : 8.5,
      map: starGlowTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const explosionField = new THREE.Points(expGeo, expMat);
    scene.add(explosionField);

    // --- C. SHOCKWAVE EXPANDING RING (Vòng sóng xung kích thanh mảnh, tinh tế) ---
    ringGeo = new THREE.RingGeometry(26, 28, 64);
    ringMat = new THREE.MeshBasicMaterial({
      color: 0x18f4fc,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });
    const shockwaveRing = new THREE.Mesh(ringGeo, ringMat);
    shockwaveRing.position.z = 200;
    scene.add(shockwaveRing);

    // 4. TIMELINE CONTROLLER & ANIMATION LOOP (Sử dụng delta-time chuẩn xác)
    const startTime = performance.now();
    let lastTime = startTime;
    globalGalaxyTelemetry.animationRunning = true;

    const animate = (currentTime: number) => {
      if (isTerminated) return;

      const delta = Math.min((currentTime - lastTime) / 1000, 0.06);
      lastTime = currentTime;
      const elapsed = (currentTime - startTime) / 1000;
      globalGalaxyTelemetry.frameCount++;

      // Chuẩn hóa delta factor (60 FPS = 1.0)
      const deltaFactor = delta * 60;

      // Cập nhật Phase cho Telemetry
      if (elapsed < 1.2) {
        globalGalaxyTelemetry.currentPhase = 'Starfield';
      } else if (elapsed < 2.6) {
        globalGalaxyTelemetry.currentPhase = 'Hyperspace';
      } else if (elapsed < 3.7) {
        globalGalaxyTelemetry.currentPhase = 'Galaxy Explosion';
      } else if (elapsed < 4.8) {
        globalGalaxyTelemetry.currentPhase = 'Brand Reveal';
      } else {
        globalGalaxyTelemetry.currentPhase = 'Hero Transition';
      }

      // === PHASE 1 & 2: STARFIELD & HYPERSPACE ===
      let speedMultiplier = 1.0;
      if (!prefersReducedMotion && elapsed > 1.2 && elapsed <= 2.6) {
        // Hyperspace Easing: Tăng tốc cực kỳ mượt mà lên tới 42x
        const progress = (elapsed - 1.2) / 1.4;
        speedMultiplier = 1.0 + Math.pow(progress, 2.2) * 42.0;
        // Camera lao về phía trước tạo chiều sâu không gian
        camera.position.z = 800 - Math.pow(progress, 2.0) * 220;
      } else if (elapsed > 2.6) {
        speedMultiplier = Math.max(0.6, 10.0 - (elapsed - 2.6) * 4.0);
        camera.position.z = Math.min(800, camera.position.z + 180 * delta);
      }

      // Cập nhật hạt lớn (Major Stars)
      if (starGeoMajor) {
        const pMajor = (starGeoMajor.attributes.position as THREE.BufferAttribute).array as Float32Array;
        for (let i = 0; i < majorCount; i++) {
          const i3 = i * 3;
          pMajor[i3 + 2] += majorVels[i] * speedMultiplier * deltaFactor;
          if (pMajor[i3 + 2] > 850) {
            pMajor[i3 + 2] = -1500;
            pMajor[i3] = (Math.random() - 0.5) * 2000;
            pMajor[i3 + 1] = (Math.random() - 0.5) * 1500;
          }
        }
        (starGeoMajor.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      }

      // Cập nhật hạt sâu (Deep Stars)
      if (starGeoDeep) {
        const pDeep = (starGeoDeep.attributes.position as THREE.BufferAttribute).array as Float32Array;
        for (let i = 0; i < deepCount; i++) {
          const i3 = i * 3;
          pDeep[i3 + 2] += deepVels[i] * speedMultiplier * deltaFactor;
          if (pDeep[i3 + 2] > 850) {
            pDeep[i3 + 2] = -1600;
            pDeep[i3] = (Math.random() - 0.5) * 2500;
            pDeep[i3 + 1] = (Math.random() - 0.5) * 1800;
          }
        }
        (starGeoDeep.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      }

      // Camera gentle swirl
      if (!prefersReducedMotion) {
        camera.rotation.z = Math.sin(elapsed * 0.5) * 0.05;
        camera.position.x = Math.sin(elapsed * 0.7) * 30;
        camera.position.y = Math.cos(elapsed * 0.6) * 18;
      }

      // === PHASE 3: GALAXY EXPLOSION ===
      if (elapsed >= 2.6 && expGeo && expMat) {
        const expElapsed = elapsed - 2.6;
        const expPosAttr = expGeo.attributes.position as THREE.BufferAttribute;
        const expPosArray = expPosAttr.array as Float32Array;

        expMat.opacity = Math.max(0, Math.min(1.0, 1.25 - expElapsed * 0.48));

        const damping = Math.max(0.91, 0.985 - expElapsed * 0.032);
        for (let i = 0; i < explosionCount; i++) {
          const i3 = i * 3;
          expVelocities[i3] *= damping;
          expVelocities[i3 + 1] *= damping;
          expVelocities[i3 + 2] *= damping;

          expPosArray[i3] += expVelocities[i3] * deltaFactor;
          expPosArray[i3 + 1] += expVelocities[i3 + 1] * deltaFactor;
          expPosArray[i3 + 2] += expVelocities[i3 + 2] * deltaFactor;
        }
        expPosAttr.needsUpdate = true;

        // Shockwave expansion (Vòng sóng mỏng laser mở rộng thanh thoát và tan biến)
        if (ringMat && ringGeo) {
          if (expElapsed < 0.95) {
            const ringScale = 1 + expElapsed * 26;
            shockwaveRing.scale.set(ringScale, ringScale, 1);
            ringMat.opacity = Math.max(0, 0.85 - expElapsed * 0.90);
          } else {
            ringMat.opacity = 0;
          }
        }
      }

      // === PHASE 4: LOGO REVEAL ===
      if (elapsed >= 3.6 && !showLogo) {
        setShowLogo(true);
      }

      // === PHASE 5: TRANSITION TO HERO ===
      if (elapsed >= 4.8 && !isFadingOut) {
        setIsFadingOut(true);
      }

      if (elapsed >= 5.5) {
        finishIntro();
        return;
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    // 5. RESIZE HANDLER
    handleResize = () => {
      if (isTerminated) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      globalGalaxyTelemetry.canvasWidth = w;
      globalGalaxyTelemetry.canvasHeight = h;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 6. ESCAPE KEY TO SKIP
    handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        finishIntro();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // 7. COMPREHENSIVE RESOURCE CLEANUP FUNCTION
    cleanupResources = () => {
      if (isTerminated) return;
      isTerminated = true;

      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);

      globalGalaxyTelemetry.introMounted = false;
      globalGalaxyTelemetry.animationRunning = false;

      // Dispose Geometries & Materials & Textures
      starGeoMajor?.dispose();
      starMatMajor?.dispose();
      starGeoDeep?.dispose();
      starMatDeep?.dispose();
      expGeo?.dispose();
      expMat?.dispose();
      ringGeo?.dispose();
      ringMat?.dispose();
      starGlowTex?.dispose();

      renderer?.dispose();
    };

    (canvasRef.current as any).terminateIntro = finishIntro;

    return () => {
      cleanupResources();
    };
  }, [forcePlay]);

  const handleSkip = () => {
    if (canvasRef.current && (canvasRef.current as any).terminateIntro) {
      (canvasRef.current as any).terminateIntro();
    } else {
      onCompleteRef.current();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 overflow-hidden bg-[#050510] transition-opacity duration-700 select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="Galaxy 3D Intro SMARTBUY AI"
    >
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Top Skip Button */}
      <div className="absolute top-6 right-6 z-20">
        <button
          type="button"
          onClick={handleSkip}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/90 hover:text-white backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg group"
          aria-label="Bỏ qua phần giới thiệu 3D"
        >
          <span>BỎ QUA</span>
          <X className="w-3.5 h-3.5 text-[#18F4FC] group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {/* Center Brand Logo & Typography Reveal (Scene 4) */}
      <div
        className={`absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center pointer-events-none transition-all duration-700 ease-out ${
          showLogo ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Ambient Purple/Cyan Glow Backdrop */}
        <div className="absolute w-[360px] h-[360px] sm:w-[500px] sm:h-[500px] rounded-full bg-gradient-to-tr from-[#8B5CF6]/35 via-[#22D3EE]/30 to-[#EC4899]/25 blur-3xl -z-10 animate-pulse" />

        {/* Real Brand Logo from public/images/branding/ */}
        <div className="relative mb-4 drop-shadow-[0_0_40px_rgba(34,211,238,0.5)]">
          <img
            src="/images/branding/smartbuy-ai-logo-white-text.png"
            alt="SMARTBUY AI"
            className="h-14 sm:h-20 md:h-24 w-auto object-contain"
          />
        </div>

        {/* Tagline */}
        <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold tracking-[0.25em] text-[#18F4FC] uppercase font-mono drop-shadow-md">
          <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
          <span>YOUR STYLE. YOUR RULES.</span>
          <Sparkles className="w-4 h-4 text-[#EC4899]" />
        </div>

        <p className="text-xs sm:text-sm text-[#D4D4D8] font-sans tracking-wider mt-2 uppercase font-medium">
          Kỷ nguyên thời trang tương lai &amp; Trợ lý AI Stylist
        </p>
      </div>
    </div>
  );
};
