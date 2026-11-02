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
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [logoImageError, setLogoImageError] = useState(false);

  // Ref lưu onComplete để tránh re-trigger effect khi parent re-render
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Ref lưu hàm finishIntro để nút Skip hoặc phím ESC có thể gọi bất kỳ lúc nào
  const finishIntroRef = useRef<() => void>(() => {});

  useEffect(() => {
    // 1. Cập nhật Telemetry
    globalGalaxyTelemetry.introMounted = true;
    globalGalaxyTelemetry.frameCount = 0;
    globalGalaxyTelemetry.currentPhase = 'Initializing';
    globalGalaxyTelemetry.lastError = null;

    // 2. Kiểm tra prefers-reduced-motion (tôn trọng thiết lập trợ năng khi không ép buộc forcePlay)
    const prefersReducedMotion =
      !forcePlay &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    globalGalaxyTelemetry.prefersReducedMotion = prefersReducedMotion;

    const container = containerRef.current;
    if (!container) {
      globalGalaxyTelemetry.lastError = 'Container element not found';
      onCompleteRef.current();
      return;
    }

    const width = window.innerWidth || 1280;
    const height = window.innerHeight || 800;
    const isMobile = width < 768;
    globalGalaxyTelemetry.canvasWidth = width;
    globalGalaxyTelemetry.canvasHeight = height;

    let isTerminated = false;
    let isCleanedUp = false;
    let animationFrameId = 0;
    let activeCanvas: HTMLCanvasElement | null = null;

    // Helper tạo Texture hạt sao siêu sáng 64x64 với Additive Radial Glow
    const createSuperGlowTexture = () => {
      const pCanvas = document.createElement('canvas');
      pCanvas.width = 64;
      pCanvas.height = 64;
      const pCtx = pCanvas.getContext('2d');
      if (pCtx) {
        const grad = pCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        grad.addColorStop(0.14, 'rgba(255, 255, 255, 1.0)');
        grad.addColorStop(0.30, 'rgba(224, 247, 255, 0.95)');
        grad.addColorStop(0.52, 'rgba(34, 211, 238, 0.70)');
        grad.addColorStop(0.78, 'rgba(139, 92, 246, 0.35)');
        grad.addColorStop(1.0, 'rgba(5, 5, 16, 0.0)');
        pCtx.fillStyle = grad;
        pCtx.fillRect(0, 0, 64, 64);
      }
      const tex = new THREE.CanvasTexture(pCanvas);
      tex.flipY = false;
      tex.premultiplyAlpha = false;
      return tex;
    };

    // Forward declarations for event handlers
    let handleResize: () => void = () => {};
    let handleKeyDown: (e: KeyboardEvent) => void = () => {};
    let handleVisibilityChange: () => void = () => {};
    let handleContextLost: (e: Event) => void = () => {};

    // Forward declarations for THREE objects
    let renderer: THREE.WebGLRenderer | null = null;
    let starGlowTex: THREE.CanvasTexture | null = null;
    let starGeoMajor: THREE.BufferGeometry | null = null;
    let starMatMajor: THREE.PointsMaterial | null = null;
    let starGeoDeep: THREE.BufferGeometry | null = null;
    let starMatDeep: THREE.PointsMaterial | null = null;
    let expGeo: THREE.BufferGeometry | null = null;
    let expMat: THREE.PointsMaterial | null = null;
    let ringGeo: THREE.RingGeometry | null = null;
    let ringMat: THREE.MeshBasicMaterial | null = null;

    // Safety fallback timeout: Đảm bảo Intro kết thúc mượt mà và chuyển trang đúng hạn
    const safetyTimeout = setTimeout(() => {
      finishIntro();
    }, prefersReducedMotion ? 1600 : 5800);

    // HÀM DỌN DẸP TOÀN BỘ TÀI NGUYÊN (Zero Memory Leaks)
    const cleanupResources = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      isTerminated = true;

      clearTimeout(safetyTimeout);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (activeCanvas) {
        activeCanvas.removeEventListener('webglcontextlost', handleContextLost);
      }

      globalGalaxyTelemetry.introMounted = false;
      globalGalaxyTelemetry.animationRunning = false;

      // Dispose Geometries, Materials, Textures
      try {
        starGeoMajor?.dispose();
        starMatMajor?.dispose();
        starGeoDeep?.dispose();
        starMatDeep?.dispose();
        expGeo?.dispose();
        expMat?.dispose();
        ringGeo?.dispose();
        ringMat?.dispose();
        starGlowTex?.dispose();

        if (renderer) {
          renderer.dispose();
          renderer.forceContextLoss();
        }
      } catch {
        // Safe ignore
      }

      // Xóa Canvas khỏi DOM container để mount kế tiếp (hoặc StrictMode) luôn nhận canvas sạch
      if (activeCanvas && activeCanvas.parentNode) {
        activeCanvas.parentNode.removeChild(activeCanvas);
        activeCanvas = null;
      }
    };

    // KẾT THÚC VÀ BÁO HOÀN THÀNH
    const finishIntro = () => {
      if (isTerminated) return;
      isTerminated = true;
      globalGalaxyTelemetry.introMounted = false;
      globalGalaxyTelemetry.animationRunning = false;
      globalGalaxyTelemetry.currentPhase = 'Completed';
      cleanupResources();
      onCompleteRef.current();
    };

    finishIntroRef.current = finishIntro;

    // Trợ năng prefers-reduced-motion: Hiện logo nhẹ nhàng và hoàn tất nhanh
    if (prefersReducedMotion) {
      setShowLogo(true);
      if (progressBarRef.current) {
        progressBarRef.current.style.width = '100%';
      }
      const reducedMotionTimer = setTimeout(finishIntro, 1200);
      return () => {
        clearTimeout(reducedMotionTimer);
        cleanupResources();
      };
    }

    // Keyboard ESC to skip
    handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        finishIntro();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // --- FALLBACK 2D CANVAS KHI THIẾT BỊ HOẶC MÔI TRƯỜNG KHÔNG HỖ TRỢ WEBGL ---
    const runCanvas2DFallback = () => {
      globalGalaxyTelemetry.webglAvailable = false;
      globalGalaxyTelemetry.rendererInitialized = false;
      globalGalaxyTelemetry.animationRunning = true;

      // Gỡ bỏ canvas cũ nếu có và tạo canvas 2D hoàn toàn mới
      if (activeCanvas && activeCanvas.parentNode) {
        activeCanvas.parentNode.removeChild(activeCanvas);
      }

      const canvas2D = document.createElement('canvas');
      canvas2D.className = 'absolute inset-0 w-full h-full block pointer-events-none';
      canvas2D.width = width;
      canvas2D.height = height;
      canvas2D.setAttribute('data-testid', 'galaxy-intro-canvas');
      container.prepend(canvas2D);
      activeCanvas = canvas2D;

      const ctx = canvas2D.getContext('2d');
      if (!ctx) {
        // Fallback tĩnh cuối cùng: Hiện logo rồi hoàn tất sau 1.5s
        globalGalaxyTelemetry.lastError = 'Neither WebGL nor 2D Context available. Using CSS reveal.';
        setShowLogo(true);
        setTimeout(finishIntro, 1500);
        return;
      }

      const numParticles = isMobile ? 220 : 400;
      const particles = Array.from({ length: numParticles }, () => ({
        x: (Math.random() - 0.5) * width,
        y: (Math.random() - 0.5) * height,
        z: Math.random() * 1000 + 1,
        size: Math.random() * 2.5 + 1.5,
        color: ['#FFFFFF', '#22D3EE', '#18F4FC', '#C084FC', '#8B5CF6'][Math.floor(Math.random() * 5)],
      }));

      let lastTime2D = performance.now();
      let totalElapsed2D = 0;

      handleVisibilityChange = () => {
        if (!document.hidden) {
          lastTime2D = performance.now();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      const animate2D = (now: number) => {
        if (isTerminated) return;

        if (document.hidden) {
          animationFrameId = requestAnimationFrame(animate2D);
          return;
        }

        const delta = Math.min((now - lastTime2D) / 1000, 0.05);
        lastTime2D = now;
        totalElapsed2D += delta;
        const elapsed = totalElapsed2D;
        globalGalaxyTelemetry.frameCount++;

        if (elapsed < 1.2) {
          globalGalaxyTelemetry.currentPhase = 'Starfield (2D)';
        } else if (elapsed < 2.6) {
          globalGalaxyTelemetry.currentPhase = 'Hyperspace (2D)';
        } else if (elapsed < 3.7) {
          globalGalaxyTelemetry.currentPhase = 'Galaxy Explosion (2D)';
        } else if (elapsed < 4.8) {
          globalGalaxyTelemetry.currentPhase = 'Brand Reveal (2D)';
          setShowLogo(true);
        } else {
          globalGalaxyTelemetry.currentPhase = 'Hero Transition (2D)';
          setIsFadingOut(true);
        }

        if (progressBarRef.current) {
          const pct = Math.min(100, Math.round((elapsed / 5.2) * 100));
          progressBarRef.current.style.width = `${pct}%`;
        }

        if (elapsed >= 5.5) {
          finishIntro();
          return;
        }

        ctx.fillStyle = 'rgba(5, 5, 16, 0.28)';
        ctx.fillRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;
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

      animationFrameId = requestAnimationFrame(animate2D);
    };

    // --- KHỞI TẠO THREE.JS WEBGL CANVAS ĐỘC LẬP ---
    const webglCanvas = document.createElement('canvas');
    webglCanvas.className = 'absolute inset-0 w-full h-full block pointer-events-none';
    webglCanvas.setAttribute('data-testid', 'galaxy-intro-canvas');
    container.prepend(webglCanvas);
    activeCanvas = webglCanvas;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas: webglCanvas,
        alpha: false,
        antialias: !isMobile, // Tắt khử răng cưa trên mobile để tiết kiệm VRAM và tăng FPS
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      });

      if (!renderer.getContext()) {
        throw new Error('WebGL context is not available');
      }

      globalGalaxyTelemetry.webglAvailable = true;
      globalGalaxyTelemetry.rendererInitialized = true;
    } catch (err: any) {
      globalGalaxyTelemetry.lastError = `WebGL Init Failed: ${err?.message || err}. Using 2D fallback.`;
      runCanvas2DFallback();
      return () => cleanupResources();
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.0 : 1.5));

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);
    scene.fog = new THREE.FogExp2(0x050510, 0.0009);

    const camera = new THREE.PerspectiveCamera(65, width / height, 1, 3500);
    camera.position.z = 800;

    // Phân tầng số lượng hạt theo thiết bị để đảm bảo 60fps mượt mà
    const totalStarCount = isMobile ? 3500 : 7500;
    const majorCount = Math.floor(totalStarCount * 0.28);
    const deepCount = totalStarCount - majorCount;
    const explosionCount = isMobile ? 2200 : 4800;

    const brightPalette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xffffff),
      new THREE.Color(0x18f4fc),
      new THREE.Color(0x22d3ee),
      new THREE.Color(0xc084fc),
      new THREE.Color(0x8b5cf6),
    ];

    starGlowTex = createSuperGlowTexture();

    // 1. MAJOR STARS
    starGeoMajor = new THREE.BufferGeometry();
    const majorPos = new Float32Array(majorCount * 3);
    const majorCols = new Float32Array(majorCount * 3);
    const majorVels = new Float32Array(majorCount);

    for (let i = 0; i < majorCount; i++) {
      const i3 = i * 3;
      majorPos[i3] = (Math.random() - 0.5) * 2000;
      majorPos[i3 + 1] = (Math.random() - 0.5) * 1500;
      majorPos[i3 + 2] = (Math.random() - 0.5) * 2400;

      const c = brightPalette[Math.floor(Math.random() * 4)];
      majorCols[i3] = c.r;
      majorCols[i3 + 1] = c.g;
      majorCols[i3 + 2] = c.b;

      majorVels[i] = 2.2 + Math.random() * 3.3;
    }

    starGeoMajor.setAttribute('position', new THREE.BufferAttribute(majorPos, 3));
    starGeoMajor.setAttribute('color', new THREE.BufferAttribute(majorCols, 3));

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

    // 2. DEEP STARS
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

      deepVels[i] = 1.5 + Math.random() * 2.3;
    }

    starGeoDeep.setAttribute('position', new THREE.BufferAttribute(deepPos, 3));
    starGeoDeep.setAttribute('color', new THREE.BufferAttribute(deepCols, 3));

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

    // 3. EXPLOSION PARTICLES
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
      const speed = 6.0 + Math.random() * 16.0;

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

    // 4. SHOCKWAVE RING
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

    // 5. ANIMATION TIMELINE VỚI XỬ LÝ CHUYỂN TAB ỔN ĐỊNH
    let lastTime = performance.now();
    let totalElapsed = 0;
    globalGalaxyTelemetry.animationRunning = true;

    handleVisibilityChange = () => {
      // Khi tab mở lại từ nền: Đặt lại lastTime để không bị nhảy cóc thời gian (Zero Delta Jump)
      if (!document.hidden) {
        lastTime = performance.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const animate = (currentTime: number) => {
      if (isTerminated) return;

      // Nếu tab đang ẩn trong nền: Tiếp tục chờ requestAnimationFrame mà không tăng thời gian animation
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      const delta = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;
      totalElapsed += delta;
      const elapsed = totalElapsed;
      globalGalaxyTelemetry.frameCount++;

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
      if (elapsed > 1.2 && elapsed <= 2.6) {
        const progress = (elapsed - 1.2) / 1.4;
        speedMultiplier = 1.0 + Math.pow(progress, 2.2) * 42.0;
        camera.position.z = 800 - Math.pow(progress, 2.0) * 220;
      } else if (elapsed > 2.6) {
        speedMultiplier = Math.max(0.6, 10.0 - (elapsed - 2.6) * 4.0);
        camera.position.z = Math.min(800, camera.position.z + 180 * delta);
      }

      // Major Stars update
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

      // Deep Stars update
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
      camera.rotation.z = Math.sin(elapsed * 0.5) * 0.05;
      camera.position.x = Math.sin(elapsed * 0.7) * 30;
      camera.position.y = Math.cos(elapsed * 0.6) * 18;

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

        // Shockwave expansion
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

      // === PHASE 5: HERO TRANSITION ===
      if (elapsed >= 4.8 && !isFadingOut) {
        setIsFadingOut(true);
      }

      // Cập nhật thanh tiến trình mượt mà ở 60fps qua DOM Ref
      if (progressBarRef.current) {
        const pct = Math.min(100, Math.round((elapsed / 5.2) * 100));
        progressBarRef.current.style.width = `${pct}%`;
      }

      // Tự động kết thúc Intro sau 5.5s
      if (elapsed >= 5.5) {
        finishIntro();
        return;
      }

      if (renderer) {
        renderer.render(scene, camera);
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    // 6. RESIZE HANDLER
    handleResize = () => {
      if (isTerminated || !renderer) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      globalGalaxyTelemetry.canvasWidth = w;
      globalGalaxyTelemetry.canvasHeight = h;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 7. WEBGL CONTEXT LOST FAIL-SAFE
    handleContextLost = (e: Event) => {
      e.preventDefault();
      globalGalaxyTelemetry.lastError = 'WebGL context lost. Finishing intro gracefully.';
      finishIntro();
    };
    webglCanvas.addEventListener('webglcontextlost', handleContextLost);

    return () => {
      cleanupResources();
    };
  }, [forcePlay]);

  const handleSkip = () => {
    finishIntroRef.current();
  };

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 overflow-hidden bg-[#050510] transition-opacity duration-700 select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="Galaxy 3D Intro SMARTBUY AI"
      data-testid="galaxy-intro-container"
    >
      {/* Top Skip Button */}
      <div className="absolute top-6 right-6 z-20">
        <button
          type="button"
          onClick={handleSkip}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/40 hover:bg-black/60 active:scale-95 text-white/90 hover:text-white backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg group"
          aria-label="Bỏ qua Intro"
          data-testid="skip-intro-btn"
        >
          <span>Bỏ qua Intro</span>
          <X className="w-3.5 h-3.5 text-[#18F4FC] group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {/* Center Brand Logo & Typography Reveal (Scene 4) */}
      <div
        className={`absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center pointer-events-none transition-all duration-700 ease-out ${
          showLogo ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        aria-live="polite"
      >
        {/* Ambient Purple/Cyan Glow Backdrop */}
        <div className="absolute w-[360px] h-[360px] sm:w-[500px] sm:h-[500px] rounded-full bg-gradient-to-tr from-[#8B5CF6]/35 via-[#22D3EE]/30 to-[#EC4899]/25 blur-3xl -z-10 animate-pulse" />

        {/* Real Brand Logo from public/images/branding/ */}
        <div className="relative mb-4 drop-shadow-[0_0_40px_rgba(34,211,238,0.5)]">
          {!logoImageError ? (
            <img
              src="/images/branding/smartbuy-ai-logo-white-text.png"
              alt="SMARTBUY AI"
              className="h-14 sm:h-20 md:h-24 w-auto object-contain"
              onError={() => setLogoImageError(true)}
            />
          ) : (
            <span className="text-2xl sm:text-4xl md:text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-[#18F4FC] to-[#8B5CF6]">
              SMARTBUY AI
            </span>
          )}
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

      {/* Bottom Progress Bar & Loading Status */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 w-72 max-w-[85vw] pointer-events-none">
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-md p-0.5 border border-white/10">
          <div
            ref={progressBarRef}
            className="h-full bg-gradient-to-r from-[#8B5CF6] via-[#18F4FC] to-[#22D3EE] rounded-full transition-all duration-75 shadow-[0_0_12px_rgba(24,244,252,0.8)]"
            style={{ width: '0%' }}
          />
        </div>
        <div className="flex items-center justify-between w-full text-[10px] font-mono tracking-widest text-[#18F4FC]/80 uppercase">
          <span>SMARTBUY AI</span>
          <span>{isFadingOut ? 'READY' : 'EXPERIENCE'}</span>
        </div>
      </div>
    </div>
  );
};
