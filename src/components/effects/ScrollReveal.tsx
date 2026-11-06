import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fade-up' | 'fade-in' | 'scale-up' | 'slide-left' | 'slide-right';
  delay?: number; // ms
  duration?: number; // ms
  threshold?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  animation = 'fade-up',
  delay = 0,
  duration = 600,
  threshold = 0.15,
}) => {
  const domRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Nếu thiết bị yêu cầu giảm chuyển động, hiển thị ngay lập tức
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const currentEl = domRef.current;
    if (currentEl) {
      observer.observe(currentEl);
    }

    return () => {
      if (currentEl) {
        observer.unobserve(currentEl);
      }
    };
  }, [threshold]);

  const getAnimationStyles = () => {
    const baseTransition = `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;

    if (!isVisible) {
      switch (animation) {
        case 'fade-up':
          return {
            opacity: 0,
            transform: 'translateY(28px)',
            transition: baseTransition,
          };
        case 'fade-in':
          return {
            opacity: 0,
            transition: baseTransition,
          };
        case 'scale-up':
          return {
            opacity: 0,
            transform: 'scale(0.96)',
            transition: baseTransition,
          };
        case 'slide-left':
          return {
            opacity: 0,
            transform: 'translateX(28px)',
            transition: baseTransition,
          };
        case 'slide-right':
          return {
            opacity: 0,
            transform: 'translateX(-28px)',
            transition: baseTransition,
          };
        default:
          return {
            opacity: 0,
            transform: 'translateY(20px)',
            transition: baseTransition,
          };
      }
    }

    return {
      opacity: 1,
      transform: 'none',
      transition: baseTransition,
    };
  };

  return (
    <div ref={domRef} className={className} style={getAnimationStyles()}>
      {children}
    </div>
  );
};
