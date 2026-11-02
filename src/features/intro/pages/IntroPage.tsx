import React, { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GalaxyIntro } from '@/components/effects/GalaxyIntro';
import { MockRepo } from '@/mocks/repository';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';
import { safeSessionStorage } from '@/lib/storage';
import { resetGlobalScroll } from '@/components/common/ScrollToTop';

export const IntroPage: React.FC = () => {
  useRepoSubscription(['auth']);
  const navigate = useNavigate();
  const hasFinishedRef = useRef(false);

  // Xác định trạng thái phiên động theo thời gian thực (không lưu cứng trong useState)
  const currentUser = MockRepo.getCurrentUser();
  const isCustomer = currentUser?.role === 'customer';
  const isIntroActive = safeSessionStorage.getItem('sb_intro_active') === '1';
  const isIntroSeen = safeSessionStorage.getItem('sb_intro_seen') === '1';

  // Kiểm tra chính xác 4 điều kiện bắt buộc:
  // 1. Người dùng đã đăng nhập chưa?
  // 2. Người dùng có role CUSTOMER không?
  // 3. Có yêu cầu chạy Intro từ phiên đăng nhập mới không? (sb_intro_active === '1')
  // 4. Intro đã hoàn tất chưa? (!isIntroSeen)
  const isValidSession = Boolean(currentUser && isCustomer && isIntroActive && !isIntroSeen);

  useEffect(() => {
    // Nếu phiên không hợp lệ hoặc đã xem xong, điều hướng an toàn ngay lập tức
    if (!isValidSession) {
      if (currentUser?.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (!currentUser) {
        navigate('/login', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isValidSession, currentUser, navigate]);

  const handleComplete = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    // 1. Đánh dấu Intro đã xem
    safeSessionStorage.setItem('sb_intro_seen', '1');
    // 2. Xóa trạng thái chờ Intro của phiên
    safeSessionStorage.removeItem('sb_intro_active');
    safeSessionStorage.removeItem('sb_post_intro_redirect');

    // 3. Cuộn trang chủ lên đầu
    resetGlobalScroll();

    // 4. Chuyển về trang chủ khách hàng (/)
    navigate('/', { replace: true });
  }, [navigate]);

  if (!isValidSession) {
    return (
      <div
        className="fixed inset-0 z-50 bg-[#050510] overflow-hidden select-none"
        aria-label="Đang chuyển hướng SMARTBUY AI"
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#050510] overflow-hidden select-none">
      <GalaxyIntro forcePlay={true} onComplete={handleComplete} />
    </div>
  );
};
