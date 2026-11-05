import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant', // Cuộn tức thì lên đầu khi đổi route để trải nghiệm tự nhiên nhất
    });
  }, [pathname, search]);

  return null;
}
