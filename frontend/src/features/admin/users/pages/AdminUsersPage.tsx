import React from 'react';
import { MockRepo } from '@/mocks/repository';
import { User, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';

export const AdminUsersPage: React.FC = () => {
  useRepoSubscription(['auth', 'orders']);
  const users = MockRepo.getAllUsers();
  const orders = MockRepo.getOrders();
  const currentUser = MockRepo.getCurrentUser();
  const { success } = useToast();

  const handleToggleRole = (user: User) => {
    const nextRole: UserRole = user.role === 'admin' ? 'customer' : 'admin';
    MockRepo.updateUserProfile({
      ...user,
      role: nextRole,
    });
    success('Đã cập nhật vai trò', `${user.name} -> ${nextRole === 'admin' ? 'Quản trị viên' : 'Khách hàng'}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-brand-charcoal">
            Quản lý Tài khoản Demo
          </h1>
          <p className="text-xs sm:text-sm text-brand-secondary mt-1">
            Danh sách người dùng và phân quyền trong môi trường thử nghiệm frontend SMARTBUY AI.
          </p>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-brand-paper rounded-brand-xl border border-brand-border/60 shadow-subtle overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs min-w-[700px]">
          <thead>
            <tr className="bg-brand-sand/50 text-brand-charcoal font-semibold border-b border-brand-border">
              <th className="p-3.5">Người dùng</th>
              <th className="p-3.5">Số điện thoại</th>
              <th className="p-3.5">Số đơn đã đặt</th>
              <th className="p-3.5 text-center">Vai trò hiện tại</th>
              <th className="p-3.5 text-right">Thao tác đổi vai trò</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/40">
            {users.map((u) => {
              const orderCount = orders.filter((o) => o.userId === u.id).length;
              const isCurrent = currentUser?.id === u.id;
              return (
                <tr key={u.id} className="hover:bg-brand-sand/20 transition-colors">
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-brand-sand border shrink-0">
                        {u.avatar ? (
                          <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-brand-forest">
                            {u.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-brand-charcoal text-sm flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-brand-forest text-brand-ivory px-1.5 py-0.5 rounded-full font-normal">
                              Bạn đang đăng nhập
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-brand-muted">{u.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="p-3.5 text-brand-secondary font-medium">{u.phone}</td>

                  <td className="p-3.5 font-bold text-brand-charcoal">
                    <span className="px-2.5 py-0.5 rounded-full bg-brand-sand text-brand-secondary">
                      {orderCount} đơn hàng
                    </span>
                  </td>

                  <td className="p-3.5 text-center">
                    <Badge variant={u.role === 'admin' ? 'terracotta' : 'forest'}>
                      {u.role === 'admin' ? 'Quản trị viên (Admin)' : 'Khách hàng (Customer)'}
                    </Badge>
                  </td>

                  <td className="p-3.5 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={() => handleToggleRole(u)}
                    >
                      {u.role === 'admin' ? 'Chuyển về Khách hàng' : 'Nâng cấp lên Admin'}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
