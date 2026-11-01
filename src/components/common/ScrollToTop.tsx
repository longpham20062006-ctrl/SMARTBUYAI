import { useLayoutEffect, useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Ensure browser history does not fight custom route scroll reset
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

/**
 * Universal scroll position reset function
 * Targets the window, root document elements, and any internal layout scroll containers
 * (such as AdminLayout <main className="overflow-y-auto">).
 */
export function resetGlobalScroll() {
  if (typeof window === 'undefined') return;

  // 1. Reset standard window scroll
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'instant',
  });

  // 2. Reset document root elements
  if (document.documentElement) {
    document.documentElement.scrollTop = 0;
    document.documentElement.scrollLeft = 0;
  }
  if (document.body) {
    document.body.scrollTop = 0;
    document.body.scrollLeft = 0;
  }

  // 3. Reset nested scroll containers (such as AdminLayout main container)
  const containers = document.querySelectorAll<HTMLElement>(
    'main, [data-admin-main], [data-scroll-container], #admin-main-scroll'
  );
  containers.forEach((el) => {
    if (el.scrollTop !== 0) el.scrollTop = 0;
    if (el.scrollLeft !== 0) el.scrollLeft = 0;
  });
}

export function ScrollToTop() {
  const { pathname, search, key } = useLocation();
  const navigationType = useNavigationType();
  const prevPathRef = useRef<string>(pathname);
  const prevSearchRef = useRef<string>(search);

  // Synchronous layout effect before paint
  useLayoutEffect(() => {
    const pathChanged = prevPathRef.current !== pathname;
    const searchChanged = prevSearchRef.current !== search;

    prevPathRef.current = pathname;
    prevSearchRef.current = search;

    // Check if test parameter ?scrollTo= is present
    const searchParams = new URLSearchParams(search);
    if (searchParams.has('scrollTo')) {
      return;
    }

    if (pathChanged || searchChanged) {
      resetGlobalScroll();
    }
  }, [pathname, search, key, navigationType]);

  // Secondary effect to prevent any late asynchronous layout pushes
  useEffect(() => {
    const searchParams = new URLSearchParams(search);
    if (searchParams.has('scrollTo')) {
      return;
    }
    resetGlobalScroll();
  }, [pathname, search]);

  return null;
}
