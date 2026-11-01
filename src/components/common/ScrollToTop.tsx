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

  // Synchronous layout effect before paint
  useLayoutEffect(() => {
    const pathChanged = prevPathRef.current !== pathname;
    prevPathRef.current = pathname;

    // Check if test parameter ?scrollTo= is present
    const searchParams = new URLSearchParams(search);
    if (searchParams.has('scrollTo')) {
      return;
    }

    // Khi người dùng bấm nút Back hoặc Forward (POP), bảo tồn vị trí lịch sử trình duyệt
    if (navigationType === 'POP') {
      return;
    }

    // CHỈ cuộn lên đầu trang khi ĐIỀU HƯỚNG ROUTE MỚI (PUSH hoặc REPLACE).
    // Tuyệt đối không tự cuộn toàn trang khi chỉ thay đổi query param (chọn màu, size, sort, filter...)
    if (pathChanged) {
      resetGlobalScroll();
    }
  }, [pathname, key, navigationType, search]);

  // Secondary effect to prevent any late asynchronous layout pushes after lazy chunks resolve
  useEffect(() => {
    const searchParams = new URLSearchParams(search);
    if (searchParams.has('scrollTo')) {
      return;
    }
    if (navigationType === 'POP') {
      return;
    }

    // Đảm bảo cuộn về đầu khi route mới được nạp
    resetGlobalScroll();
  }, [pathname, navigationType]);

  return null;
}
