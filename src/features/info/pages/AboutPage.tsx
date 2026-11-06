import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  Target,
  Compass,
  Users,
  Award,
  ArrowRight,
  Shirt,
  Layers,
  HeartHandshake,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AboutPage: React.FC = () => {
  const milestones = [
    {
      year: '2024',
      title: 'Khởi đầu ý tưởng AI-First Fashion',
      description:
        'Nhận thấy người tiêu dùng trực tuyến thường gặp khó khăn về việc chọn đúng kích cỡ và phối đồ theo dáng người, đội ngũ kỹ sư và nhà thiết kế đã bắt đầu nghiên cứu mô hình AI Stylist chuyên biệt cho phom dáng người Việt.',
      icon: Target,
    },
    {
      year: '2025',
      title: 'Ra mắt Virtual Try-On Studio & AI Outfit Generator',
      description:
        'Triển khai phòng thử đồ ảo 3D và thuật toán phối đồ đa phong cách. Tích hợp thanh toán an toàn, mở rộng liên kết các xưởng may gia công chuẩn xuất khẩu.',
      icon: Sparkles,
    },
    {
      year: '2026',
      title: 'Nâng cấp Hệ sinh thái Doanh nghiệp & 300+ Sản phẩm',
      description:
        'Hoàn thiện kiến trúc Full-Stack Spring Boot + React, nâng cấp toàn bộ kho hình ảnh HD sắc nét, phân quyền quản trị thông minh và ra mắt tính năng đổi size 15 ngày tận nơi.',
      icon: Award,
    },
  ];

  const coreValues = [
    {
      title: 'AI Phục Vụ Gu Thẩm Mỹ',
      desc: 'Trí tuệ nhân tạo không thay thế thẩm mỹ mà là công cụ gợi ý thông minh, giúp bạn tự tin phối đồ theo cá tính riêng mà không tốn hàng giờ suy nghĩ.',
      icon: Sparkles,
      color: 'bg-purple-50 text-[#8B5CF6]',
    },
    {
      title: 'Chuẩn Phom Dáng Người Việt',
      desc: 'Mọi thiết kế áo thun, quần tây, blazer hay váy đầm đều được tinh chỉnh thông số đo may đo sát thực tế vóc dáng Á Đông.',
      icon: Shirt,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Minh Bạch & Bền Vững',
      desc: 'Công khai chất liệu từ Cotton Supima 250gsm, Lụa tơ tằm đến Linen tự nhiên Normandy. Đóng gói hộp giấy tái chế bảo vệ môi trường.',
      icon: ShieldCheck,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Trải Nghiệm Khách Hàng Là Số 1',
      desc: 'Chính sách bảo hành tận tâm, miễn phí đổi size trong vòng 15 ngày tận cửa nhà trên khắp 63 tỉnh thành.',
      icon: HeartHandshake,
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  const teamMembers = [
    {
      name: 'Võ Minh Quân',
      role: 'Founder & Product Lead',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
      bio: 'Hơn 8 năm kinh nghiệm trong kiến trúc E-commerce và trải nghiệm người dùng số.',
    },
    {
      name: 'Dr. Lê Hoàng Tuấn',
      role: 'Chief AI Scientist',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
      bio: 'Chuyên gia Deep Learning & Computer Vision, phụ trách thuật toán Virtual Try-On.',
    },
    {
      name: 'Nguyễn Bích Ngọc',
      role: 'Fashion Creative Director',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80',
      bio: 'Cựu giám đốc sáng tạo tuần lễ thời trang trẻ, định hình phong cách Gen Z thời thượng.',
    },
    {
      name: 'Trần Đăng Khoa',
      role: 'Lead Full-Stack Engineer',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
      bio: 'Phụ trách kiến trúc microservices Spring Boot & React hiệu năng cao.',
    },
  ];

  return (
    <div className="bg-white min-h-screen text-[#18181B]">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-zinc-950 text-white py-20 lg:py-28">
        <div className="absolute inset-0 opacity-25">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80"
            alt="SMARTBUY AI Studio"
            className="w-full h-full object-cover filter blur-[2px]"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />

        <div className="relative max-w-container mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#DDD6FE] text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
            <span>Câu chuyện thương hiệu</span>
          </div>

          <h1 className="font-editorial text-3xl sm:text-5xl lg:text-6xl font-normal leading-tight max-w-4xl mx-auto">
            Thời trang có gu, kích cỡ chuẩn xác nhờ sức mạnh Trí tuệ Nhân tạo.
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-zinc-300 leading-relaxed font-sans">
            SMARTBUY AI ra đời với khát vọng xóa bỏ nỗi lo mua quần áo không vừa size, mang đến trải nghiệm mua sắm cá nhân hóa, tự tin và tiện lợi nhất cho thế hệ trẻ Việt Nam.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Link to="/products">
              <Button variant="primary" size="lg" className="rounded-xl font-bold bg-[#8B5CF6] hover:bg-[#7C3AED] text-white">
                Khám phá Bộ sưu tập
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/try-on">
              <Button variant="outline" size="lg" className="rounded-xl font-bold border-zinc-700 text-white hover:bg-zinc-800">
                Thử đồ AI trực tuyến
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. VISION & MISSION */}
      <section className="py-16 sm:py-24 border-b border-[#E4E4E7] bg-[#FAFAF8]">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-[#E4E4E7] shadow-subtle space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#8B5CF6] flex items-center justify-center">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-editorial text-2xl font-bold text-[#18181B]">
                Tầm nhìn tương lai
              </h3>
              <p className="text-sm text-[#71717A] leading-relaxed">
                Trở thành nền tảng thời trang thông minh hàng đầu tại Việt Nam và khu vực Đông Nam Á, nơi công nghệ AI kết hợp hài hòa với nghệ thuật may mặc truyền thống để tạo nên trải nghiệm mua sắm độc bản cho từng cá nhân.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-[#8B5CF6]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Số hóa 100% quy trình tư vấn và thử phom</span>
              </div>
            </div>

            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-[#E4E4E7] shadow-subtle space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="font-editorial text-2xl font-bold text-[#18181B]">
                Sứ mệnh của chúng tôi
              </h3>
              <p className="text-sm text-[#71717A] leading-relaxed">
                Giúp mọi khách hàng luôn tìm thấy những trang phục vừa vặn hoàn hảo, tự tin tỏa sáng trong phong cách riêng mà không cần phải băn khoăn về size số hay mất thời gian đổi trả phức tạp.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>Thời trang ứng dụng cao với mức chi phí hợp lý</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TIMELINE MILESTONES */}
      <section className="py-16 sm:py-24">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase font-bold tracking-widest text-[#8B5CF6]">
              Hành trình phát triển
            </span>
            <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#18181B]">
              Các cột mốc tạo nên SMARTBUY AI
            </h2>
            <p className="text-sm text-[#71717A]">
              Từng bước phát triển từ một dự án nghiên cứu AI nhỏ thành hệ thống thương mại điện tử thời trang vững chắc.
            </p>
          </div>

          <div className="relative border-l-2 border-[#8B5CF6]/30 ml-4 md:ml-32 space-y-12">
            {milestones.map((m, idx) => {
              const Icon = m.icon;
              return (
                <div key={idx} className="relative pl-8 sm:pl-10">
                  <div className="absolute -left-4 top-0 w-8 h-8 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center shadow-md">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-[#E4E4E7] shadow-subtle space-y-2">
                    <div className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-[#F3E8FF] text-[#7C3AED]">
                      Năm {m.year}
                    </div>
                    <h4 className="text-lg font-bold text-[#18181B]">{m.title}</h4>
                    <p className="text-xs sm:text-sm text-[#71717A] leading-relaxed">
                      {m.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. CORE VALUES */}
      <section className="py-16 sm:py-24 bg-[#FAFAF8] border-y border-[#E4E4E7]">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase font-bold tracking-widest text-[#8B5CF6]">
              Triết lý hoạt động
            </span>
            <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#18181B]">
              4 Giá trị cốt lõi
            </h2>
            <p className="text-sm text-[#71717A]">
              Kim chỉ nam trong mọi quyết định thiết kế trang phục và phát triển tính năng công nghệ.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreValues.map((v, i) => {
              const Icon = v.icon;
              return (
                <div key={i} className="bg-white p-6 rounded-3xl border border-[#E4E4E7] shadow-subtle space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${v.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-bold text-[#18181B]">{v.title}</h4>
                    <p className="text-xs text-[#71717A] leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. TEAM MEMBERS */}
      <section className="py-16 sm:py-24">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase font-bold tracking-widest text-[#8B5CF6]">
              Con người kiến tạo
            </span>
            <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#18181B]">
              Đội ngũ SMARTBUY AI
            </h2>
            <p className="text-sm text-[#71717A]">
              Sự kết hợp giữa những kỹ sư phần mềm tâm huyết và các chuyên gia thời trang hàng đầu.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((m, idx) => (
              <div key={idx} className="bg-white rounded-3xl border border-[#E4E4E7] overflow-hidden shadow-subtle flex flex-col">
                <div className="h-56 bg-zinc-100 overflow-hidden">
                  <img
                    src={m.avatar}
                    alt={m.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h4 className="text-sm font-bold text-[#18181B]">{m.name}</h4>
                    <div className="text-xs font-semibold text-[#8B5CF6]">{m.role}</div>
                    <p className="text-[11px] text-[#71717A] mt-2 leading-relaxed">{m.bio}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. BOTTOM CALL TO ACTION */}
      <section className="bg-zinc-950 text-white py-16">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="font-editorial text-3xl sm:text-4xl font-normal">
            Sẵn sàng khám phá phong cách riêng của bạn?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
            Hơn 300+ sản phẩm thời trang cao cấp đang chờ đón bạn cùng trợ lý AI Stylist thông minh.
          </p>
          <div className="pt-2 flex items-center justify-center gap-4">
            <Link to="/products">
              <Button variant="primary" size="lg" className="rounded-xl font-bold bg-[#8B5CF6] hover:bg-[#7C3AED] text-white">
                Bắt đầu mua sắm ngay
              </Button>
            </Link>
            <Link to="/size-guide">
              <Button variant="outline" size="lg" className="rounded-xl font-bold border-zinc-700 text-white hover:bg-zinc-900">
                Xem Bảng kích cỡ
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

