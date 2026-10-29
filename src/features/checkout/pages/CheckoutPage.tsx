import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MockRepo } from '@/mocks/repository';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { useRepoSubscription } from '@/hooks/useRepoSubscription';
import {
  CheckCircle2,
  CreditCard,
  Banknote,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  useRepoSubscription(['cart']);
  const cart = MockRepo.getCart();
  const currentUser = MockRepo.getCurrentUser();
  const navigate = useNavigate();
  const { error, success } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form values
  const defaultAddress = currentUser?.savedAddresses?.[0];
  const [fullName, setFullName] = useState(defaultAddress?.fullName || currentUser?.name || '');
  const [phone, setPhone] = useState(defaultAddress?.phone || currentUser?.phone || '');
  const [email, setEmail] = useState(defaultAddress?.email || currentUser?.email || '');
  const [province, setProvince] = useState(defaultAddress?.province || 'Thành phố Hồ Chí Minh');
  const [district, setDistrict] = useState(defaultAddress?.district || 'Quận 1');
  const [ward, setWard] = useState(defaultAddress?.ward || 'Phường Bến Nghé');
  const [street, setStreet] = useState(defaultAddress?.street || '45 Đường Lê Duẩn');
  const [note, setNote] = useState(defaultAddress?.note || '');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'DEMO_TRANSFER' | 'DEMO_MOMO'>('COD');

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Vui lòng nhập họ và tên người nhận';
    if (!phone.trim()) errs.phone = 'Vui lòng nhập số điện thoại liên lạc';
    if (!email.trim() || !email.includes('@')) errs.email = 'Vui lòng nhập email hợp lệ';
    if (!street.trim()) errs.street = 'Vui lòng nhập địa chỉ số nhà, tên đường';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePlaceOrder = () => {
    if (cart.items.length === 0) {
      error('Giỏ hàng trống', 'Vui lòng chọn sản phẩm trước khi thanh toán');
      navigate('/products');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const orderItems = cart.items.map((i) => ({
        variantId: i.id,
        productId: i.productId,
        productName: i.productName,
        brand: i.brand,
        image: i.image,
        colorName: i.color.name,
        size: i.size,
        price: i.price,
        quantity: i.quantity,
        subtotal: i.price * i.quantity,
      }));

      const res = MockRepo.createOrder({
        userId: currentUser?.id || 'user-customer-1',
        customerName: fullName,
        customerEmail: email,
        shippingAddress: {
          fullName,
          phone,
          email,
          province,
          district,
          ward,
          street,
          note,
        },
        items: orderItems,
        subtotal: cart.subtotal,
        shippingFee: cart.shippingFee,
        totalAmount: cart.total,
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PAID',
      });

      setIsSubmitting(false);

      if (res.success && res.order) {
        setCreatedOrderNumber(res.order.orderNumber);
        setStep(3);
        success('Đặt hàng thành công!', `Mã đơn hàng của bạn: ${res.order.orderNumber}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        error('Không thể hoàn tất đơn hàng', res.message);
      }
    }, 600);
  };

  // Nếu giỏ trống và chưa hoàn tất đặt đơn
  if (cart.items.length === 0 && step !== 3) {
    return (
      <div className="max-w-container mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-editorial text-2xl font-bold text-brand-charcoal">
          Giỏ hàng chưa có sản phẩm để thanh toán
        </h2>
        <Link to="/products">
          <Button variant="primary">Khám phá thời trang</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Stepper Progress */}
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between text-xs font-semibold">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-brand-accent' : 'text-brand-secondary'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 1 ? 'bg-brand-accent text-white shadow-xs' : 'bg-brand-subtle text-brand-secondary'
            }`}>
              1
            </span>
            <span>Địa chỉ giao hàng</span>
          </div>
          <div className="flex-1 h-0.5 bg-brand-border mx-4" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-brand-accent' : 'text-brand-secondary'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 2 ? 'bg-brand-accent text-white shadow-xs' : 'bg-brand-subtle text-brand-secondary'
            }`}>
              2
            </span>
            <span>Thanh toán & Duyệt</span>
          </div>
          <div className="flex-1 h-0.5 bg-brand-border mx-4" />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-brand-accent' : 'text-brand-secondary'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 3 ? 'bg-brand-accent text-white shadow-xs' : 'bg-brand-subtle text-brand-secondary'
            }`}>
              3
            </span>
            <span>Hoàn tất</span>
          </div>
        </div>
      </div>

      {/* BƯỚC 3: MÀN HÌNH ĐẶT ĐƠN THÀNH CÔNG */}
      {step === 3 ? (
        <div className="max-w-xl mx-auto bg-brand-surface rounded-2xl p-8 sm:p-10 border border-brand-border shadow-xs text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">
              Mô phỏng đặt hàng thành công
            </span>
            <h1 className="text-3xl font-black text-brand-primary mt-1">
              Cảm ơn bạn đã mua sắm!
            </h1>
            <p className="text-xs sm:text-sm text-brand-secondary mt-2">
              Đơn hàng của bạn đã được ghi nhận vào hệ thống kho SMARTBUY AI và trừ tồn kho tự động một lần.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-brand-subtle text-xs space-y-2 text-left border border-brand-border">
            <div className="flex justify-between">
              <span className="text-brand-secondary">Mã đơn hàng:</span>
              <strong className="text-brand-accent font-bold text-sm">{createdOrderNumber}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-secondary">Người nhận:</span>
              <strong className="text-brand-primary">{fullName} ({phone})</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-secondary">Địa chỉ nhận hàng:</span>
              <span className="text-brand-primary text-right max-w-xs">{street}, {ward}, {district}, {province}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-secondary">Hình thức:</span>
              <span className="font-semibold text-brand-primary">
                {paymentMethod === 'COD' ? 'Thanh toán tiền mặt khi nhận hàng (COD)' : 'Chuyển khoản / Ví điện tử (Demo)'}
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => navigate('/orders')}
            >
              Xem lịch sử đơn hàng
            </Button>
            <Button
              variant="accent"
              className="flex-1 text-xs font-bold"
              onClick={() => navigate('/products')}
            >
              Tiếp tục mua sắm
            </Button>
          </div>
        </div>
      ) : (
        /* BƯỚC 1 & 2: FORM ĐIỀN THÔNG TIN VÀ TÓM TẮT */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Cột trái: Form theo bước (7 cột) */}
          <div className="lg:col-span-7 bg-brand-paper rounded-brand-xl p-6 sm:p-8 border border-brand-border/60 shadow-subtle">
            {step === 1 ? (
              <form onSubmit={handleNextToPayment} className="space-y-6">
                <div className="border-b border-brand-border/40 pb-3">
                  <h2 className="text-lg font-bold text-brand-charcoal">Thông tin người nhận hàng</h2>
                  <p className="text-xs text-brand-secondary mt-0.5">
                    Dữ liệu mô phỏng được nạp tự động từ tài khoản của bạn.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Họ và tên người nhận *"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    error={errors.fullName}
                    placeholder="Ví dụ: Nguyễn Minh Anh"
                  />
                  <Input
                    label="Số điện thoại di động *"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    error={errors.phone}
                    placeholder="Ví dụ: 0901234567"
                  />
                </div>

                <Input
                  label="Email nhận thông báo đơn hàng *"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  placeholder="name@example.com"
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Tỉnh / Thành phố *"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                  />
                  <Input
                    label="Quận / Huyện *"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                  />
                  <Input
                    label="Phường / Xã *"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                  />
                </div>

                <Input
                  label="Địa chỉ cụ thể (Số nhà, tên đường, căn hộ) *"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  error={errors.street}
                  placeholder="Ví dụ: 45 Đường Lê Duẩn, Căn hộ 12B"
                />

                <Input
                  label="Ghi chú thêm cho người giao hàng (Tùy chọn)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: Giao vào giờ hành chính, gọi trước khi đến 15 phút..."
                />

                <div className="pt-4 flex justify-between items-center border-t border-brand-border/40">
                  <Link to="/cart" className="text-xs text-brand-muted hover:text-brand-charcoal flex items-center gap-1">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Quay lại giỏ hàng</span>
                  </Link>

                  <Button type="submit" variant="primary" className="text-xs px-6 h-11 uppercase font-semibold">
                    Sang bước thanh toán
                    <ArrowRight className="w-3.5 h-3.5 ml-2" />
                  </Button>
                </div>
              </form>
            ) : (
              /* Bước 2: Chọn phương thức thanh toán & xác nhận */
              <div className="space-y-6">
                <div className="border-b border-brand-border/40 pb-3">
                  <h2 className="text-lg font-bold text-brand-charcoal">Phương thức thanh toán</h2>
                  <p className="text-xs text-brand-secondary mt-0.5">
                    Hệ thống chỉ chạy mô phỏng frontend — không yêu cầu thẻ tín dụng hay tiền thật.
                  </p>
                </div>

                {/* Danh sách phương thức */}
                <div className="space-y-3">
                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'COD'
                        ? 'border-brand-accent bg-brand-accent-light/40 ring-1 ring-brand-accent'
                        : 'border-brand-border hover:bg-brand-subtle'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                      className="mt-1 text-brand-accent focus:ring-brand-accent"
                    />
                    <div className="space-y-1 text-xs">
                      <div className="font-semibold text-brand-primary flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-brand-accent" />
                        <span>Thanh toán tiền mặt khi nhận hàng (COD)</span>
                      </div>
                      <p className="text-brand-secondary">
                        Được kiểm tra hàng trước khi nhận. Thanh toán trực tiếp cho nhân viên giao vận.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'DEMO_TRANSFER'
                        ? 'border-brand-accent bg-brand-accent-light/40 ring-1 ring-brand-accent'
                        : 'border-brand-border hover:bg-brand-subtle'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'DEMO_TRANSFER'}
                      onChange={() => setPaymentMethod('DEMO_TRANSFER')}
                      className="mt-1 text-brand-accent focus:ring-brand-accent"
                    />
                    <div className="space-y-1 text-xs">
                      <div className="font-semibold text-brand-primary flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-brand-accent" />
                        <span>Chuyển khoản ngân hàng mô phỏng (Demo Transfer)</span>
                      </div>
                      <p className="text-brand-secondary">
                        Tự động duyệt trạng thái ĐÃ THANH TOÁN trong môi trường thử nghiệm.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Tóm tắt địa chỉ người nhận */}
                <div className="p-4 rounded-xl bg-brand-subtle text-xs space-y-1 border border-brand-border">
                  <div className="font-bold text-brand-primary flex items-center justify-between">
                    <span>Giao đến địa chỉ:</span>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-brand-accent underline font-normal cursor-pointer"
                    >
                      Thay đổi
                    </button>
                  </div>
                  <div><strong>{fullName}</strong> ({phone})</div>
                  <div className="text-brand-secondary">{street}, {ward}, {district}, {province}</div>
                </div>

                <div className="pt-4 flex justify-between items-center border-t border-brand-border">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-brand-secondary hover:text-brand-primary flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Quay lại thông tin nhận</span>
                  </button>

                  <Button
                    type="button"
                    variant="accent"
                    isLoading={isSubmitting}
                    onClick={handlePlaceOrder}
                    className="text-xs px-8 h-12 uppercase font-bold shadow-sm cursor-pointer"
                  >
                    XÁC NHẬN ĐẶT HÀNG ({formatPrice(cart.total)})
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Cột phải: Xem lại giỏ hàng (5 cột) */}
          <div className="lg:col-span-5 bg-brand-surface rounded-2xl p-6 border border-brand-border shadow-xs space-y-5">
            <h3 className="text-base font-bold text-brand-primary border-b border-brand-border pb-3 flex items-center justify-between">
              <span>Đơn hàng của bạn</span>
              <span className="text-xs font-normal text-brand-secondary">
                ({cart.items.reduce((s, i) => s + i.quantity, 0)} món)
              </span>
            </h3>

            {/* List items thu nhỏ */}
            <div className="max-h-72 overflow-y-auto divide-y divide-brand-border pr-1">
              {cart.items.map((item) => (
                <div key={item.id} className="py-3 first:pt-0 flex gap-3 items-center text-xs">
                  <img
                    src={item.image}
                    alt=""
                    className="w-14 aspect-[3/4] rounded-lg object-cover bg-brand-subtle shrink-0 border border-brand-border"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-brand-primary line-clamp-1">{item.productName}</div>
                    <div className="text-[11px] text-brand-secondary">
                      Màu: {item.color.name} • Size: {item.size} • SL: {item.quantity}
                    </div>
                  </div>
                  <div className="font-bold text-brand-primary shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Chi phí */}
            <div className="border-t border-brand-border pt-4 space-y-2 text-xs text-brand-secondary">
              <div className="flex justify-between">
                <span>Tạm tính:</span>
                <span className="font-semibold text-brand-primary">{formatPrice(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Phí giao hàng:</span>
                <span className="font-semibold text-emerald-700">
                  {cart.shippingFee === 0 ? 'Miễn phí' : formatPrice(cart.shippingFee)}
                </span>
              </div>
              <div className="border-t border-brand-border pt-3 flex justify-between items-baseline text-sm">
                <span className="font-bold text-brand-primary">Tổng thanh toán:</span>
                <span className="text-xl font-black text-brand-primary">
                  {formatPrice(cart.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
